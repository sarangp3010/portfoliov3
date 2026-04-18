import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../services/diagnostics.service.js';
import { AuthRequest } from '../types/index.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? req.ip;
  const ua = req.headers['user-agent']?.slice(0, 200);

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const path = req.path.replace(/\/[a-z0-9]{20,}/g, '/:id'); // normalise cuid paths
    logRequest({
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
      ip,
      userAgent: ua,
      userId: (req as AuthRequest).user?.id,
    });
  });

  res.on('error', (err: Error) => {
    logRequest({
      method: req.method,
      path: req.path,
      statusCode: 500,
      durationMs: Date.now() - start,
      ip, ua,
      errorMessage: err.message,
    } as any);
  });

  next();
};
