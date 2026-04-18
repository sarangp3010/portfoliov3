import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createRouter } from './routes/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      config.clientUrl,
      config.customerUrl,
      // Direct Vite ports (fallback)
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      // Subdomain dev proxy
      'http://public.localhost:5173',
      'http://admin.localhost:5173',
      'http://customer.localhost:5173',
    ].filter(Boolean);
    // Allow: no origin (server-to-server / Postman), matching list, or any *.localhost
    if (!origin || allowed.includes(origin) || /\.localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // dev: allow all; tighten for production via CLIENT_URL
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/inquiries', rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, error: 'Too many submissions, please try again later' } }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/customer/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/customer/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));
app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, max: 20, message: { success: false, error: 'Too many messages, slow down' } }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logger (fire-and-forget, never blocks)
import { requestLogger } from './middleware/requestLogger.js';
app.use('/api', requestLogger);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

// API routes
app.use('/api', createRouter());

app.use(notFound);
app.use(errorHandler);

export default app;
