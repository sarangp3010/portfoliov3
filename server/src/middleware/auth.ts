import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { cacheGet, cacheSet } from '../services/cache.service.js';

const SESSION_CACHE_TTL = 5 * 60_000; // 5 minutes

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; name?: string; role: string; jti?: string };

    // Verify the session is still active (revocation check)
    const jti = decoded.jti;
    if (jti) {
      const cacheKey = `admin:session:${jti}`;
      const cached = await cacheGet<boolean>(cacheKey);
      if (cached === null) {
        const session = await prisma.adminSession.findFirst({
          where: { jti, isActive: true, expiresAt: { gt: new Date() } },
          select: { id: true },
        });
        if (!session) {
          res.status(401).json({ success: false, error: 'Session expired or revoked' });
          return;
        }
        await cacheSet(cacheKey, true, SESSION_CACHE_TTL);
      } else if (cached === false) {
        res.status(401).json({ success: false, error: 'Session expired or revoked' });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const customerAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; name?: string; role: string };
    if (decoded.role !== 'CUSTOMER') {
      res.status(403).json({ success: false, error: 'Customer access only' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
};

// Decodes JWT if present but never rejects — used for public endpoints
// that can optionally provide richer context when authenticated
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; name?: string; role: string };
      req.user = decoded;
    } catch {
      // invalid token — continue as unauthenticated
    }
  }
  next();
};

// Accepts either an admin JWT or a customer JWT — both share notification endpoints
export const eitherAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ success: false, error: 'Authentication required' }); return; }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; name?: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
