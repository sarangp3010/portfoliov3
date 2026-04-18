import { logger } from '../utils/logger.js';

export async function sendSmsNotification(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    logger.warn('SMS not configured — skipping SMS to', to);
    return;
  }

  try {
    // Dynamic import to avoid errors when Twilio is not installed
    const twilio = await import('twilio').then(m => m.default || m);
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from, to });
    logger.info(`SMS sent to ${to}`);
  } catch (err) {
    logger.error('SMS send failed:', err);
    // Non-fatal — don't throw
  }
}
