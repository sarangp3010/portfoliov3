import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthRequest } from '../types/index.js';
import { cacheDelete } from '../services/cache.service.js';

function parseTtlMs(expiresIn: string): number {
  const m = expiresIn.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 86_400_000;
  const n = parseInt(m[1]);
  const units: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (units[m[2]] ?? 86_400_000);
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required', 400);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new AppError('Invalid credentials', 401);
    if (user.role !== 'ADMIN') throw new AppError('Admin access only', 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, jti },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    await prisma.adminSession.create({
      data: {
        userId: user.id,
        jti,
        ipAddress: req.ip ?? req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + parseTtlMs(config.jwt.expiresIn)),
      },
    });

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    });
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jti = (req.user as any)?.jti as string | undefined;
    if (jti) {
      await prisma.adminSession.updateMany({
        where: { jti, isActive: true },
        data: { isActive: false },
      });
      await cacheDelete(`admin:session:${jti}`);
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password incorrect', 400);
    if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
};
