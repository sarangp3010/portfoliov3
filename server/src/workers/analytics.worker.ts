import { Worker } from 'bullmq';
import { getBullMQConnection } from '../config/redis.js';
import { cachePurgeExpired } from '../services/cache.service.js';
import { logger } from '../utils/logger.js';
import type { AnalyticsJobData } from '../services/queue.service.js';

export const startAnalyticsWorker = (): void => {
  const conn = getBullMQConnection();
  if (!conn) return;

  new Worker<AnalyticsJobData>(
    'analytics',
    async (job) => {
      if (job.name === 'purge-expired') {
        await cachePurgeExpired();
        logger.debug('Cache purge completed');
      }
    },
    { connection: conn },
  );

  logger.info('Analytics worker started');
};
