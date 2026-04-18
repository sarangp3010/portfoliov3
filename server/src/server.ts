import fs from 'fs';
import path from 'path';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';
import { verifySmtp } from './services/email.service.js';

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    await verifySmtp();
    const host = config.nodeEnv === 'development' ? '127.0.0.1' : '0.0.0.0';
    app.listen(config.port, host, () => {
      logger.info(`API server listening on ${host}:${config.port} [${config.nodeEnv}]`);
      if (config.nodeEnv === 'development') {
        logger.info('Access via dev proxy → http://api.localhost:5173');
      }
    });
  } catch (err) {
    logger.error('Failed to start', err);
    process.exit(1);
  }
}

start();
