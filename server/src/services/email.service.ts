import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { renderEmail } from './email-template.service.js';

const createTransport = () => nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

// ─── Queue hook ───────────────────────────────────────────────────────────────
// Set by server.ts after BullMQ is initialised. When set, sendEmail enqueues
// instead of calling SMTP directly; the email worker calls sendEmailDirect.

type RawEmail = { to: string; subject: string; html: string };
let _enqueue: ((payload: RawEmail) => Promise<void>) | null = null;
export const useEmailQueue = (fn: (payload: RawEmail) => Promise<void>): void => { _enqueue = fn; };

// ─── Generic low-level sender ─────────────────────────────────────────────────

export const emailService = {
  /** Sends via queue if available, otherwise directly over SMTP. */
  async sendEmail({ to, subject, html }: RawEmail): Promise<void> {
    if (!config.smtp.user || !to) {
      logger.warn(`Email not sent (SMTP not configured or missing recipient): ${subject}`);
      return;
    }
    if (_enqueue) {
      await _enqueue({ to, subject, html });
      return;
    }
    await this.sendEmailDirect({ to, subject, html });
  },

  /** Always sends directly over SMTP — used by the email worker. */
  async sendEmailDirect({ to, subject, html }: RawEmail): Promise<void> {
    if (!config.smtp.user || !to) return;
    try {
      await createTransport().sendMail({ from: config.smtp.from, to, subject, html });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      logger.error(`Email send failed to ${to}:`, err);
    }
  },
};

// ─── Template-based senders ────────────────────────────────────────────────────

async function sendFromTemplate(
  to: string,
  key: string,
  vars: Record<string, string | number | undefined>
): Promise<void> {
  const rendered = await renderEmail(key, vars);
  if (!rendered) {
    logger.warn(`[email] No template for key "${key}" — email not sent`);
    return;
  }
  await emailService.sendEmail({ to, subject: rendered.subject, html: rendered.html });
}

// ─── Specific email functions (called by controllers) ─────────────────────────

export interface InquiryData {
  name: string;
  email: string;
  subject: string;
  message: string;
  serviceType?: string;
}

export async function sendInquiryEmails(data: InquiryData): Promise<void> {
  if (!config.smtp.user) { logger.warn('SMTP not configured — skipping inquiry emails'); return; }
  const preview = data.message.length > 200 ? data.message.slice(0, 200) + '…' : data.message;
  await Promise.all([
    // Admin notification
    sendFromTemplate(config.smtp.adminEmail, 'inquiry_received', {
      name: data.name, email: data.email, subject: data.subject,
      message: data.message, service: data.serviceType ?? '',
    }),
    // Sender confirmation
    sendFromTemplate(data.email, 'inquiry_confirmation', {
      name: data.name, email: data.email, subject: data.subject, preview,
    }),
  ]);
  logger.info(`Inquiry emails sent for ${data.email}`);
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const portalUrl = config.customerUrl ?? 'http://customer.localhost:5173';
  await sendFromTemplate(to, 'welcome', { name, email: to, portal_url: portalUrl });
}

export async function sendPaymentSuccessEmail(
  to: string, name: string, service: string, amount: string, date: string
): Promise<void> {
  await sendFromTemplate(to, 'payment_success', { name, email: to, service, amount, date });
}

export async function sendPaymentReceiptEmail(
  to: string, name: string, service: string, amount: string,
  date: string, receiptId: string
): Promise<void> {
  await sendFromTemplate(to, 'payment_receipt', {
    name, email: to, service, amount, date, receipt_id: receiptId,
  });
}

export async function sendPaymentFailedEmail(
  to: string, name: string, service: string, date: string
): Promise<void> {
  const portalUrl = config.customerUrl ?? 'http://customer.localhost:5173';
  await sendFromTemplate(to, 'payment_failed', { name, email: to, service, date, portal_url: portalUrl });
}

export async function sendContactMessageNotification(
  adminEmail: string, customerName: string, customerEmail: string, message: string
): Promise<void> {
  await sendFromTemplate(adminEmail, 'contact_message', {
    name: customerName, email: customerEmail, message,
  });
}

export async function sendAdminReplyEmail(
  to: string, name: string, reply: string
): Promise<void> {
  const portalUrl = config.customerUrl ?? 'http://customer.localhost:5173';
  await sendFromTemplate(to, 'admin_reply', { name, email: to, reply, portal_url: portalUrl });
}

export const verifySmtp = async (): Promise<void> => {
  if (!config.smtp.user) return;
  try {
    await createTransport().verify();
    logger.info('SMTP connection verified');
  } catch (err) {
    logger.warn('SMTP verification failed — emails will not be sent', err);
  }
};

// ─── Event-driven entry point ─────────────────────────────────────────────────
// Maps application event types to template keys + recipient resolution.
// To add a new email: (1) create template in DB, (2) add mapping below.

type EmailVars = Record<string, string | number | undefined>;

interface EmailEvent {
  templateKey: string;
  to: string;
  vars: EmailVars;
}

// Event → template key mapping
const EVENT_MAP: Record<string, (data: EmailVars) => Omit<EmailEvent, 'vars'> & { vars: EmailVars }> = {
  inquiry_created: (d) => ({
    templateKey: 'inquiry_received',
    to: String(d.adminEmail ?? ''),
    vars: d,
  }),
  inquiry_confirmation: (d) => ({
    templateKey: 'inquiry_confirmation',
    to: String(d.email ?? ''),
    vars: d,
  }),
  inquiry_replied: (d) => ({
    templateKey: 'inquiry_confirmation', // reuse or create 'inquiry_replied' template
    to: String(d.email ?? ''),
    vars: d,
  }),
  payment_success: (d) => ({
    templateKey: 'payment_success',
    to: String(d.email ?? ''),
    vars: d,
  }),
  payment_receipt: (d) => ({
    templateKey: 'payment_receipt',
    to: String(d.email ?? ''),
    vars: d,
  }),
  payment_failed: (d) => ({
    templateKey: 'payment_failed',
    to: String(d.email ?? ''),
    vars: d,
  }),
  customer_welcome: (d) => ({
    templateKey: 'welcome',
    to: String(d.email ?? ''),
    vars: d,
  }),
  contact_message: (d) => ({
    templateKey: 'contact_message',
    to: String(d.adminEmail ?? ''),
    vars: d,
  }),
  admin_reply: (d) => ({
    templateKey: 'admin_reply',
    to: String(d.email ?? ''),
    vars: d,
  }),
};

/**
 * sendTemplatedEmail — single entry point for all application emails.
 *
 * Usage:
 *   await sendTemplatedEmail('payment_success', {
 *     email: 'user@example.com', name: 'Jane', service: 'Pro Plan',
 *     amount: '$4,500', date: '1 Jan 2025',
 *   });
 *
 * To add a new email type:
 *   1. Create the template in DB (or add to FALLBACK_TEMPLATES)
 *   2. Add an entry to EVENT_MAP above
 */
export async function sendTemplatedEmail(
  eventType: string,
  data: EmailVars
): Promise<void> {
  const resolver = EVENT_MAP[eventType];
  if (!resolver) {
    logger.warn(`[email] Unknown event type: "${eventType}"`);
    return;
  }
  const { templateKey, to, vars } = resolver(data);
  if (!to) {
    logger.warn(`[email] No recipient for event "${eventType}"`);
    return;
  }
  await sendFromTemplate(to, templateKey, vars);
}
