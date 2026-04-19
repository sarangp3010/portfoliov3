import Stripe from 'stripe';
import { prisma } from '../config/prisma.js';
import { config } from '../config/index.js';
import { cacheDeletePattern } from './cache.service.js';

// Lazy-init Stripe so the server starts even without keys configured
let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!_stripe) {
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2024-06-20' });
  }
  return _stripe;
};

// ─── Create Checkout Session ──────────────────────────────────────────────────

export interface CheckoutParams {
  type: 'service' | 'custom' | 'donation';
  amount: number;       // cents
  currency?: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  serviceId?: string;
  serviceName?: string;
  inquiryId?: string;
  paymentSource?: 'direct' | 'inquiry';
  planId?: string;
  metadata?: Record<string, string>;
}

export const createCheckoutSession = async (params: CheckoutParams) => {
  const stripe = getStripe();
  const currency = params.currency ?? 'usd';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency,
        product_data: {
          name: params.description,
          ...(params.serviceName ? { description: `Service: ${params.serviceName}` } : {}),
        },
        unit_amount: params.amount,
      },
      quantity: 1,
    }],
    customer_email: params.customerEmail,
    success_url: params.paymentSource === 'direct' && params.metadata?.fromCustomerPortal
      ? `${config.customerUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`
      : `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.paymentSource === 'direct' && params.metadata?.fromCustomerPortal
      ? `${config.customerUrl}/services`
      : `${config.clientUrl}/payment/cancel`,
    metadata: {
      type: params.type,
      paymentSource: params.paymentSource ?? 'inquiry',
      ...(params.planId      ? { planId:       params.planId }       : {}),
      ...(params.serviceId   ? { serviceId:    params.serviceId }    : {}),
      ...(params.serviceName ? { serviceName:  params.serviceName }  : {}),
      ...(params.inquiryId   ? { inquiryId:    params.inquiryId }    : {}),
      ...(params.customerName? { customerName: params.customerName } : {}),
      ...(params.metadata    ? params.metadata : {}),
    },
  });

  // Create PENDING payment record
  await prisma.payment.create({
    data: {
      stripeSessionId: session.id,
      amount: params.amount,
      currency,
      status: 'PENDING',
      type: params.type,
      paymentSource: params.paymentSource ?? 'inquiry',
      planId: params.planId,
      description: params.description,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      inquiryId: params.inquiryId,
      metadata: params.metadata as any,
      updatedAt: new Date(),
    },
  });
  await Promise.all([
    cacheDeletePattern('payments:list:'),
    cacheDeletePattern('payments:analytics:'),
  ]);

  return { sessionId: session.id, url: session.url, stripeSessionId: session.id, publishableKey: config.stripe.publishableKey };
};

// ─── Handle Webhook ───────────────────────────────────────────────────────────

export const handleWebhook = async (rawBody: Buffer, signature: string) => {
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Log the event (idempotency check)
  const existing = await prisma.paymentWebhookEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing?.processed) return { received: true };

  await prisma.paymentWebhookEvent.upsert({
    where:  { stripeEventId: event.id },
    create: { stripeEventId: event.id, type: event.type, payload: event as any, updatedAt: undefined } as any,
    update: {},
  });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'COMPLETED',
          stripePaymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          receiptUrl: session.invoice as string | undefined,
          updatedAt: new Date(),
        },
      });
      await Promise.all([
        cacheDeletePattern('payments:list:'),
        cacheDeletePattern('payments:analytics:'),
      ]);

      // Send SMS if customer has phone number
      try {
        const { sendPaymentSms } = await import('../controllers/customer.controller.js');
        if (payment.customerId) {
          await sendPaymentSms(payment.customerId, payment.amount, payment.serviceName || payment.description || 'Service');
        } else if (payment.customerEmail) {
          const customer = await prisma.customer.findUnique({ where: { email: payment.customerEmail } });
          if (customer) await sendPaymentSms(customer.id, payment.amount, payment.serviceName || payment.description || 'Service');
        }
      } catch {}

      // Send payment success email
      try {
        const { sendTemplatedEmail } = await import('./email.service.js');
        const recipientEmail = payment.customerEmail
          ?? (payment.customerId ? (await prisma.customer.findUnique({ where: { id: payment.customerId }, select: { email: true, name: true } }))?.email : undefined);
        const recipientName = payment.customerName
          ?? (payment.customerId ? (await prisma.customer.findUnique({ where: { id: payment.customerId }, select: { name: true } }))?.name : undefined);
        if (recipientEmail) {
          const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
          await sendTemplatedEmail('payment_success', {
            email: recipientEmail,
            name: recipientName ?? recipientEmail.split('@')[0],
            service: payment.serviceName ?? payment.description ?? 'Service',
            amount: fmt(payment.amount),
            date: new Date().toLocaleDateString(),
          });
        }
      } catch {}

      // In-app notification for customer
      try {
        const { notifyCustomer } = await import('./notification.service.js');
        if (payment.customerId) {
          const fmt = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
          await notifyCustomer(
            payment.customerId,
            'payment_success',
            `Payment of ${fmt(payment.amount)} for ${payment.serviceName ?? 'Service'} confirmed`,
            { type: 'success', link: '/payments' }
          );
        }
      } catch {}
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const expired = await prisma.payment.update({
        where: { stripeSessionId: session.id },
        data: { status: 'CANCELLED', updatedAt: new Date() },
      });
      await Promise.all([
        cacheDeletePattern('payments:list:'),
        cacheDeletePattern('payments:analytics:'),
      ]);
      // Notify customer payment didn't go through
      try {
        const { notifyCustomer } = await import('./notification.service.js');
        if (expired.customerId) {
          await notifyCustomer(
            expired.customerId,
            'payment_failed',
            `Payment for ${expired.serviceName ?? 'Service'} was not completed`,
            { type: 'warning', link: '/payments' }
          );
        }
      } catch {}
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      if (typeof charge.payment_intent === 'string') {
        await prisma.payment.updateMany({
          where: { stripePaymentIntent: charge.payment_intent },
          data:  { status: 'REFUNDED', updatedAt: new Date() },
        });
        await Promise.all([
          cacheDeletePattern('payments:list:'),
          cacheDeletePattern('payments:analytics:'),
        ]);
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: { stripeEventId: event.id },
      data:  { processed: true },
    });
  } catch (err: any) {
    await prisma.paymentWebhookEvent.update({
      where: { stripeEventId: event.id },
      data:  { error: err.message },
    });
  }

  return { received: true };
};

// ─── Get session status (for success page) ───────────────────────────────────

export const getSessionStatus = async (sessionId: string) => {
  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
  if (!payment) {
    // Try fetching from Stripe directly (race condition)
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { status: session.payment_status, payment: null };
  }
  return { status: payment.status, payment };
};

// ─── Service Plans (for direct payment flow) ─────────────────────────────────

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;       // cents
  priceLabel: string;
  features: string[];
  popular: boolean;
  badge?: string;
}

export const getServicePlans = async (): Promise<ServicePlan[]> => {
  // Pull live services from DB and map to payable plans.
  // Only services with a parseable numeric price are shown for direct payment.
  const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });

  const plans: ServicePlan[] = [];

  for (const s of services) {
    // Extract numeric value from price strings like "$1,500", "$4,500"
    const numeric = parseFloat(s.price.replace(/[^0-9.]/g, ''));
    if (!isNaN(numeric) && numeric > 0) {
      plans.push({
        id: s.id,
        name: s.title,
        description: s.description,
        price: Math.round(numeric * 100), // convert to cents
        priceLabel: s.price,
        features: s.features,
        popular: s.popular,
        badge: s.popular ? 'Most Popular' : undefined,
      });
    }
  }

  // Always append a custom plan at the end
  plans.push({
    id: 'custom',
    name: 'Custom Project',
    description: 'Have something unique in mind? Pay a consultation deposit to get started.',
    price: 50000, // $500
    priceLabel: '$500',
    features: ['1-hour discovery call', 'Custom scope document', 'Fixed-price proposal', 'No commitment to proceed'],
    popular: false,
    badge: 'Flexible',
  });

  return plans;
};

// ─── Payment Analytics ────────────────────────────────────────────────────────

export const getPaymentAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 86400_000);

  const [summary, byType, bySource, byDay, recent, webhookErrors] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: since } },
      _sum:   { amount: true },
      _count: { id: true },
    }),
    prisma.payment.groupBy({
      by: ['type'],
      where: { status: 'COMPLETED', createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.payment.groupBy({
      by: ['paymentSource'],
      where: { status: 'COMPLETED', createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.$queryRaw<Array<{ day: string; revenue: number; count: number }>>`
      SELECT
        DATE_TRUNC('day', "createdAt")::date::text AS day,
        SUM(amount)::int                           AS revenue,
        COUNT(*)::int                              AS count
      FROM "Payment"
      WHERE status = 'COMPLETED'
        AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, amount: true, currency: true, status: true,
        type: true, paymentSource: true, description: true, customerName: true,
        customerEmail: true, createdAt: true,
      },
    }),
    prisma.paymentWebhookEvent.count({ where: { processed: false } }),
  ]);

  const totalRevenue = summary._sum.amount ?? 0;
  const totalCount   = summary._count.id ?? 0;

  return {
    totalRevenue,
    totalCount,
    avgOrderValue: totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0,
    byType,
    bySource,
    byDay,
    recent,
    webhookErrors,
  };
};

// ─── Stripe Payment Methods ───────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(email: string, name: string): Promise<string> {
  const stripe = getStripe();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

export async function getStripePaymentMethods(email: string) {
  const stripe = getStripe();
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) return [];
  const pms = await stripe.paymentMethods.list({ customer: customers.data[0].id, type: 'card' });
  const defaultPmId = typeof customers.data[0].invoice_settings.default_payment_method === 'string'
    ? customers.data[0].invoice_settings.default_payment_method
    : customers.data[0].invoice_settings.default_payment_method?.id;
  return pms.data.map(pm => ({
    id: pm.id,
    brand: pm.card?.brand || 'unknown',
    last4: pm.card?.last4 || '****',
    expMonth: pm.card?.exp_month || 0,
    expYear: pm.card?.exp_year || 0,
    isDefault: pm.id === defaultPmId,
  }));
}

export async function createSetupSession(email: string, name: string) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(email, name);
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customerId,
    payment_method_types: ['card'],
    success_url: `${process.env.CUSTOMER_URL || 'http://localhost:3002'}/payment-methods?setup=success`,
    cancel_url: `${process.env.CUSTOMER_URL || 'http://localhost:3002'}/payment-methods`,
  });
  return { url: session.url! };
}

export async function detachPaymentMethod(pmId: string) {
  const stripe = getStripe();
  await stripe.paymentMethods.detach(pmId);
}
