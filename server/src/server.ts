import fs from 'fs';
import path from 'path';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { verifySmtp, useEmailQueue } from './services/email.service.js';
import { setupQueues, getEmailQueue, enqueueEmail, scheduleRecurringJobs } from './services/queue.service.js';
import { startEmailWorker } from './workers/email.worker.js';
import { startAnalyticsWorker } from './workers/analytics.worker.js';

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Redis + queues (optional — falls back gracefully if REDIS_URL not set)
    await connectRedis();
    setupQueues();
    if (getEmailQueue()) useEmailQueue(enqueueEmail);
    startEmailWorker();
    startAnalyticsWorker();
    await scheduleRecurringJobs();

    await verifySmtp();
    app.listen(config.port, config.host, () => {
      logger.info(`API server listening on ${config.host}:${config.port} [${config.nodeEnv}]`);
      if (config.nodeEnv === 'development') {
        logger.info('Access via dev proxy → http://api.localhost:5173');
      }
    });
  } catch (err) {
    logger.error('Failed to start', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(0);
});

start();
