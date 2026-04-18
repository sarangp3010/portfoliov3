import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import UAParser from 'ua-parser-js';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

const SESSION_TTL_DAYS = 30;

function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

function parseUA(ua?: string) {
  if (!ua) return { browser: undefined, device: undefined };
  const parser = new UAParser(ua);
  const b = parser.getBrowser();
  const d = parser.getDevice();
  return {
    browser: b.name ? `${b.name} ${b.version}` : undefined,
    device: d.type || 'desktop',
  };
}

export async function registerCustomer(data: RegisterData, ip?: string, ua?: string) {
  const existing = await prisma.customer.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const hashed = await bcrypt.hash(data.password, 12);
  const customer = await prisma.customer.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashed,
      name: data.name,
      phone: data.phone || null,
      provider: 'local',
    },
    select: { id: true, email: true, name: true, phone: true, provider: true },
  });

  const { token } = await createSession(customer.id, ip, ua);
  const jwtToken = signJwt(customer.id, customer.email, customer.name);
  return { customer, token: jwtToken, sessionToken: token };
}

export async function loginCustomer(data: LoginData, ip?: string, ua?: string) {
  const customer = await prisma.customer.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!customer) throw new AppError('Invalid credentials', 401);
  if (!customer.isActive) throw new AppError('Account is deactivated', 403);
  if (!customer.password) throw new AppError('This account uses social login. Please sign in with your provider.', 400);

  const valid = await bcrypt.compare(data.password, customer.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const { token: sessionToken } = await createSession(customer.id, ip, ua);
  const jwtToken = signJwt(customer.id, customer.email, customer.name);

  return {
    customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, provider: customer.provider },
    token: jwtToken,
    sessionToken,
  };
}

export async function logoutCustomer(sessionToken: string) {
  // Mark session as inactive if token is provided via header
  try {
    await prisma.customerSession.updateMany({
      where: { token: sessionToken, isActive: true },
      data: { isActive: false },
    });
  } catch {}
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, avatarUrl: true, provider: true, createdAt: true },
  });
}

export async function updateCustomer(id: string, data: { name?: string; phone?: string }) {
  return prisma.customer.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
    select: { id: true, email: true, name: true, phone: true, provider: true },
  });
}

export async function createSession(customerId: string, ip?: string, ua?: string) {
  const token = generateSessionToken();
  const { browser, device } = parseUA(ua);
  const session = await prisma.customerSession.create({
    data: {
      customerId,
      token,
      ipAddress: ip,
      userAgent: ua,
      browser,
      device,
      expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return session;
}

export async function touchSession(token: string) {
  try {
    await prisma.customerSession.updateMany({
      where: { token, isActive: true },
      data: { lastActiveAt: new Date() },
    });
  } catch {}
}

function signJwt(id: string, email: string, name: string) {
  return jwt.sign(
    { id, email, name, role: 'CUSTOMER' },
    config.jwt.secret,
    { expiresIn: `${SESSION_TTL_DAYS}d` } as jwt.SignOptions
  );
}

// Admin: list all customers
export async function listCustomers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, phone: true, provider: true,
        isActive: true, createdAt: true,
        _count: { select: { payments: true, sessions: true, messages: true } },
      },
    }),
    prisma.customer.count(),
  ]);
  return { customers, total, page, pages: Math.ceil(total / limit) };
}

// Admin: get customer details
export async function getCustomerDetail(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, amount: true, status: true, serviceName: true, createdAt: true },
      },
      sessions: {
        orderBy: { loginAt: 'desc' },
        take: 10,
        select: { id: true, browser: true, device: true, ipAddress: true, loginAt: true, lastActiveAt: true, isActive: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, message: true, status: true, createdAt: true },
      },
    },
  });
  return customer;
}

// Admin: toggle active
export async function setCustomerActive(id: string, isActive: boolean) {
  return prisma.customer.update({ where: { id }, data: { isActive } });
}

// Admin: list active sessions
export async function listActiveSessions() {
  return prisma.customerSession.findMany({
    where: { isActive: true, expiresAt: { gt: new Date() } },
    include: {
      customer: { select: { email: true, name: true } },
    },
    orderBy: { lastActiveAt: 'desc' },
    take: 100,
  });
}

// Admin: terminate session
export async function terminateSession(sessionId: string) {
  return prisma.customerSession.update({ where: { id: sessionId }, data: { isActive: false } });
}

// ─── OAuth Login / Register ─────────────────────────────────────────────────

export interface OAuthProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Find-or-create a customer from an OAuth provider profile.
 * Rules:
 *  1. If a customer exists with the same (provider + providerId) → log them in
 *  2. If a customer exists with the same email → link the OAuth provider and log them in
 *  3. Otherwise → create a new account
 */
export async function oauthLogin(profile: OAuthProfile, ip?: string, ua?: string) {
  // 1. Exact match on provider + providerId
  let customer = await prisma.customer.findFirst({
    where: { provider: profile.provider, providerId: profile.providerId },
  });

  // 2. Email match → link provider to existing account
  if (!customer) {
    const byEmail = await prisma.customer.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
    if (byEmail) {
      customer = await prisma.customer.update({
        where: { id: byEmail.id },
        data: {
          provider:   profile.provider,
          providerId: profile.providerId,
          avatarUrl:  byEmail.avatarUrl || profile.avatarUrl || null,
          updatedAt:  new Date(),
        },
      });
    }
  }

  // 3. New customer
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email:      profile.email.toLowerCase(),
        name:       profile.name,
        avatarUrl:  profile.avatarUrl || null,
        provider:   profile.provider,
        providerId: profile.providerId,
        // No password — OAuth accounts authenticate via provider
        emailVerified: true,
      },
    });
  }

  if (!customer.isActive) {
    throw new AppError('Account is deactivated. Please contact support.', 403);
  }

  const { token: sessionToken } = await createSession(customer.id, ip, ua);
  const jwtToken = signJwt(customer.id, customer.email, customer.name);

  return {
    customer: {
      id:       customer.id,
      email:    customer.email,
      name:     customer.name,
      phone:    customer.phone,
      avatarUrl: customer.avatarUrl,
      provider: customer.provider,
    },
    token: jwtToken,
    sessionToken,
  };
}
