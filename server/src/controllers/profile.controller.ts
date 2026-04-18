import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) throw new AppError('Profile not found', 404);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.profile.findFirst();
    const data = req.body;
    // Ensure arrays
    if (data.skills && typeof data.skills === 'string') data.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (data.techStack && typeof data.techStack === 'string') data.techStack = data.techStack.split(',').map((s: string) => s.trim()).filter(Boolean);

    const profile = existing
      ? await prisma.profile.update({ where: { id: existing.id }, data })
      : await prisma.profile.create({ data });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};
