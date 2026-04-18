import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import {
  registerCustomer, loginCustomer, logoutCustomer, getCustomerById,
  updateCustomer, listCustomers, getCustomerDetail, setCustomerActive,
  listActiveSessions, terminateSession,
} from '../services/customer.service.js';
import { sendSmsNotification } from '../services/sms.service.js';
import { emailService, sendWelcomeEmail, sendContactMessageNotification, sendAdminReplyEmail } from '../services/email.service.js';
import { notifyAdmin, notifyCustomer } from '../services/notification.service.js';

// ─── Customer Auth ─────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) throw new AppError('Email, password, and name are required', 400);
    const ip = req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;
    const result = await registerCustomer({ email, password, name, phone }, ip, ua);

    // Welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch {}

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required', 400);
    const ip = req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;
    const result = await loginCustomer({ email, password }, ip, ua);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers['x-session-token'] as string | undefined;
    if (token) await logoutCustomer(token);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await getCustomerById(req.user!.id);
    if (!customer) throw new AppError('Customer not found', 404);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone } = req.body;
    const customer = await updateCustomer(req.user!.id, { name, phone });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// ─── Customer Payments ──────────────────────────────────────────────────────

export const getMyPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { customerEmail: req.user!.email },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, stripeSessionId: true, amount: true, currency: true, status: true, description: true, serviceName: true, planId: true, createdAt: true },
      }),
      prisma.payment.count({ where: { customerEmail: req.user!.email } }),
    ]);

    res.json({ success: true, data: { payments, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const createCustomerCheckout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId, planName, amount } = req.body;
    if (!planId || !planName || !amount) throw new AppError('planId, planName, and amount required', 400);

    // Delegate to the existing payment service
    const { createCheckoutSession } = await import('../services/payment.service.js');
    const session = await createCheckoutSession({
      type: 'service',
      customerName: req.user!.name || 'Customer',
      customerEmail: req.user!.email,
      amount: Number(amount),
      description: planName,
      serviceId: planId,
      serviceName: planName,
      paymentSource: 'direct',
      planId,
      metadata: { fromCustomerPortal: 'true' },
    });

    res.json({ success: true, data: { sessionId: session.stripeSessionId, publishableKey: session.publishableKey } });
  } catch (err) { next(err); }
};

export const getReceipt = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paymentId = String(req.params.paymentId);
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, customerEmail: req.user!.email },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({
      success: true,
      data: {
        receipt: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          service: payment.serviceName || payment.description,
          date: payment.createdAt,
          stripeRef: payment.stripePaymentIntent || payment.stripeSessionId,
        },
      },
    });
  } catch (err) { next(err); }
};

// ─── Payment Methods ─────────────────────────────────────────────────────────

export const getPaymentMethods = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { getStripePaymentMethods } = await import('../services/payment.service.js');
    const methods = await getStripePaymentMethods(req.user!.email);
    res.json({ success: true, data: methods });
  } catch (err) { next(err); }
};

export const setupPaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { createSetupSession } = await import('../services/payment.service.js');
    const session = await createSetupSession(req.user!.email, req.user!.name || 'Customer');
    res.json({ success: true, data: { url: session.url } });
  } catch (err) { next(err); }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { detachPaymentMethod } = await import('../services/payment.service.js');
    await detachPaymentMethod(String(req.params.pmId));
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length < 5) throw new AppError('Message must be at least 5 characters', 400);

    await prisma.customerMessage.create({
      data: { customerId: req.user!.id, message: message.trim() },
    });

    // Notify admin via email + in-app
    try {
      await sendContactMessageNotification(
        process.env.ADMIN_EMAIL || '',
        req.user!.name ?? 'Customer',
        req.user!.email,
        message,
      );
    } catch {}
    notifyAdmin('contact_message', `Message from ${req.user!.name ?? req.user!.email}`, { type: 'info', link: '/customers' }).catch(() => {});

    res.json({ success: true, message: 'Message sent' });
  } catch (err) { next(err); }
};

// ─── Admin: Customers ────────────────────────────────────────────────────────

export const adminListCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const data = await listCustomers(page);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const adminGetCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customer = await getCustomerDetail(String(req.params.id));
    if (!customer) throw new AppError('Customer not found', 404);
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const adminToggleCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isActive } = req.body;
    const customer = await setCustomerActive(String(req.params.id), Boolean(isActive));
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

export const adminListSessions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await listActiveSessions();
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
};

export const adminTerminateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await terminateSession(String(req.params.sessionId));
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const adminListMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messages = await prisma.customerMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true, email: true } } },
    });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const adminReplyMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reply } = req.body;
    const msg = await prisma.customerMessage.update({
      where: { id: String(req.params.msgId) },
      data: { adminReply: reply, status: 'REPLIED' },
    });

    // Look up customer for email + notification
    const msgCustomer = await prisma.customer.findUnique({
      where: { id: msg.customerId },
      select: { id: true, email: true, name: true },
    });

    // Email reply to customer
    if (msgCustomer) {
      try { await sendAdminReplyEmail(msgCustomer.email, msgCustomer.name, reply); } catch {}
      notifyCustomer(msgCustomer.id, 'inquiry_replied', 'You have a new reply from the admin', { type: 'info', link: '/contact-admin' }).catch(() => {});
    }

    res.json({ success: true, data: msg });
  } catch (err) { next(err); }
};

// SMS notification after payment
export const sendPaymentSms = async (customerId: string, amount: number, serviceName: string): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { phone: true, name: true } });
    if (customer?.phone) {
      await sendSmsNotification(customer.phone, `Hi ${customer.name}, your payment of $${(amount / 100).toFixed(2)} for ${serviceName} has been confirmed. Thank you!`);
    }
  } catch {}
};
