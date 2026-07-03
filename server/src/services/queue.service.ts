import { Queue } from 'bullmq';
import { getBullMQConnection } from '../config/redis.js';
import { logger } from '../utils/logger.js';

// ─── Job payload types ─────────────────────────────────────────────────────────

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export interface AnalyticsJobData {
  task: 'purge-expired';
}

// ─── Queue singletons ──────────────────────────────────────────────────────────

let emailQueue: Queue<EmailJobData> | null = null;
let analyticsQueue: Queue<AnalyticsJobData> | null = null;

export const getEmailQueue = () => emailQueue;

export const setupQueues = (): void => {
  const conn = getBullMQConnection();
  if (!conn) {
    logger.info('Redis not available — BullMQ queues disabled, emails run synchronously');
    return;
  }
  emailQueue     = new Queue<EmailJobData>('email',     { connection: conn });
  analyticsQueue = new Queue<AnalyticsJobData>('analytics', { connection: conn });
  logger.info('BullMQ queues initialized');
};

// ─── Enqueue helpers ───────────────────────────────────────────────────────────

export const enqueueEmail = async (payload: EmailJobData): Promise<void> => {
  if (!emailQueue) return; // caller falls back to direct send
  await emailQueue.add('send', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail:     200,
  });
};

// ─── Recurring jobs ────────────────────────────────────────────────────────────

export const scheduleRecurringJobs = async (): Promise<void> => {
  if (!analyticsQueue) return;
  await analyticsQueue.add(
    'purge-expired',
    { task: 'purge-expired' },
    { repeat: { every: 10 * 60 * 1000 }, removeOnComplete: 5, removeOnFail: 5 },
  );
  logger.info('Recurring jobs scheduled (cache purge every 10 min)');
};
