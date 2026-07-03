import { Worker } from 'bullmq';
import { getBullMQConnection } from '../config/redis.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.js';
import type { EmailJobData } from '../services/queue.service.js';

export const startEmailWorker = (): void => {
  const conn = getBullMQConnection();
  if (!conn) return;

  new Worker<EmailJobData>(
    'email',
    async (job) => {
      const { to, subject, html } = job.data;
      await emailService.sendEmailDirect({ to, subject, html });
    },
    { connection: conn, concurrency: 5 },
  );

  logger.info('Email worker started (concurrency: 5)');
};
