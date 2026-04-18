/**
 * notification.service.ts
 *
 * All notification logic. Both admin and customer use the same table,
 * discriminated by recipientType: "admin" | "customer".
 */

import { prisma } from '../config/prisma.js';

export type NotificationType = 'success' | 'warning' | 'info' | 'error';
export type RecipientType    = 'admin'   | 'customer';

export interface CreateNotificationInput {
  recipientType: RecipientType;
  recipientId:   string;
  type:          NotificationType;
  event:         string;   // e.g. "inquiry_created"
  message:       string;
  link?:         string;   // e.g. "/inquiries"
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}

// ─── List (paginated) ─────────────────────────────────────────────────────────

export async function listNotifications(
  recipientType: RecipientType,
  recipientId: string,
  { page = 1, limit = 20, unreadOnly = false } = {}
) {
  const where = {
    recipientType,
    recipientId,
    ...(unreadOnly ? { isRead: false } : {}),
  };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);
  return { notifications, total, page, totalPages: Math.ceil(total / limit) };
}

// ─── Unread count ─────────────────────────────────────────────────────────────

export async function getUnreadCount(
  recipientType: RecipientType,
  recipientId: string
): Promise<number> {
  return prisma.notification.count({
    where: { recipientType, recipientId, isRead: false },
  });
}

// ─── Mark one as read ─────────────────────────────────────────────────────────

export async function markRead(id: string, recipientId: string) {
  return prisma.notification.updateMany({
    where: { id, recipientId }, // recipientId prevents reading other people's notifications
    data:  { isRead: true },
  });
}

// ─── Mark all as read ─────────────────────────────────────────────────────────

export async function markAllRead(recipientType: RecipientType, recipientId: string) {
  return prisma.notification.updateMany({
    where: { recipientType, recipientId, isRead: false },
    data:  { isRead: true },
  });
}

// ─── Convenience: notify admin (first admin user in DB) ──────────────────────

export async function notifyAdmin(
  event: string,
  message: string,
  opts: { type?: NotificationType; link?: string } = {}
) {
  try {
    const admin = await prisma.user.findFirst({ select: { id: true } });
    if (!admin) return;
    await createNotification({
      recipientType: 'admin',
      recipientId:   admin.id,
      type:          opts.type  ?? 'info',
      event,
      message,
      link:          opts.link,
    });
  } catch { /* never throw from notification side-effects */ }
}

// ─── Convenience: notify a customer ─────────────────────────────────────────

export async function notifyCustomer(
  customerId: string,
  event: string,
  message: string,
  opts: { type?: NotificationType; link?: string } = {}
) {
  try {
    await createNotification({
      recipientType: 'customer',
      recipientId:   customerId,
      type:          opts.type ?? 'info',
      event,
      message,
      link:          opts.link,
    });
  } catch { /* never throw from notification side-effects */ }
}
