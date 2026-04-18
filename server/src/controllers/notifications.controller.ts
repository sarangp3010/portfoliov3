import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  listNotifications, getUnreadCount, markRead, markAllRead,
  type RecipientType,
} from '../services/notification.service.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function getRecipient(req: AuthRequest): { recipientType: RecipientType; recipientId: string } {
  if (!req.user) throw new AppError('Unauthenticated', 401);
  const isAdmin    = req.user.role === 'ADMIN';
  const isCustomer = req.user.role === 'CUSTOMER';
  if (!isAdmin && !isCustomer) throw new AppError('Forbidden', 403);
  return {
    recipientType: isAdmin ? 'admin' : 'customer',
    recipientId:   req.user.id,
  };
}

// ── GET /notifications ────────────────────────────────────────────────────────

export const getNotifications = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { recipientType, recipientId } = getRecipient(req);
    const page       = Math.max(1, parseInt(String(req.query.page  ?? '1')));
    const unreadOnly = req.query.unread === 'true';
    const data       = await listNotifications(recipientType, recipientId, { page, unreadOnly });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// ── GET /notifications/unread-count ──────────────────────────────────────────

export const getUnread = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { recipientType, recipientId } = getRecipient(req);
    const count = await getUnreadCount(recipientType, recipientId);
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

// ── PATCH /notifications/:id/read ────────────────────────────────────────────

export const markOneRead = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { recipientId } = getRecipient(req);
    await markRead(String(req.params.id), recipientId);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── PATCH /notifications/read-all ────────────────────────────────────────────

export const markAllAsRead = async (
  req: AuthRequest, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const { recipientType, recipientId } = getRecipient(req);
    await markAllRead(recipientType, recipientId);
    res.json({ success: true });
  } catch (err) { next(err); }
};
