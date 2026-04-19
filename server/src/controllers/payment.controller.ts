import { Request, Response, NextFunction } from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  getSessionStatus,
  getPaymentAnalytics,
  getServicePlans,
} from '../services/payment.service.js';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { cached } from '../services/cache.service.js';

export const getPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await cached('payments:plans', () => getServicePlans(), 5 * 60_000);
    res.json({ success: true, data: plans });
  } catch (err) { next(err); }
};

export const createCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, amount, currency, description, customerEmail, customerName,
            serviceId, serviceName, inquiryId, paymentSource, planId } = req.body;

    if (!amount || amount < 50)  { res.status(400).json({ success: false, error: 'Minimum amount is $0.50' }); return; }
    if (!description)            { res.status(400).json({ success: false, error: 'Description required' });    return; }

    const result = await createCheckoutSession({
      type: type ?? 'custom',
      amount: Math.round(amount),
      currency: currency ?? 'usd',
      description,
      customerEmail,
      customerName,
      serviceId,
      serviceName,
      inquiryId,
      paymentSource: paymentSource ?? 'inquiry',
      planId,
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) { res.status(400).json({ error: 'Missing stripe-signature header' }); return; }
    const result = await handleWebhook(req.body as Buffer, signature);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const paymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    const result = await getSessionStatus(sessionId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const paymentAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const data = await cached(`payments:analytics:${days}`, () => getPaymentAnalytics(days), 2 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const listPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page   = parseInt(req.query.page  as string ?? '1', 10);
    const source = req.query.source as string | undefined; // 'direct' | 'inquiry' | undefined
    const limit  = 20;
    const where  = source ? { paymentSource: source } : {};
    const data = await cached(
      `payments:list:${page}:${source ?? 'all'}`,
      async () => {
        const [payments, total] = await Promise.all([
          prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
              id: true, stripeSessionId: true, amount: true, currency: true,
              status: true, type: true, paymentSource: true, planId: true,
              description: true, customerName: true, customerEmail: true,
              serviceName: true, inquiryId: true, createdAt: true,
            },
          }),
          prisma.payment.count({ where }),
        ]);
        return { payments, total, page, pages: Math.ceil(total / limit) };
      },
      60_000,
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getStripePublishableKey = (_req: Request, res: Response): void => {
  res.json({ success: true, data: { publishableKey: config.stripe.publishableKey } });
};
