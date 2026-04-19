import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { saveVersion } from '../services/version.service.js';
import { cached, cacheDeletePattern } from '../services/cache.service.js';

export const getProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cached('projects:all', () =>
      prisma.project.findMany({ orderBy: [{ featured: 'desc' }, { order: 'asc' }] }), 5 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({ where: { id: String(req.params.id) } });
    if (!project) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.create({ data: req.body });
    await cacheDeletePattern('projects:');
    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: String(req.params.id) } });
    if (existing) await saveVersion('PROJECT', existing.id, existing.title, { title: existing.title, description: existing.description, longDesc: existing.longDesc, techStack: existing.techStack, githubUrl: existing.githubUrl, liveUrl: existing.liveUrl }, (req as any).user?.id);
    const project = await prisma.project.update({ where: { id: String(req.params.id) }, data: req.body });
    await cacheDeletePattern('projects:');
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: String(req.params.id) } });
    await cacheDeletePattern('projects:');
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const deleteAllProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.project.deleteMany();
    await cacheDeletePattern('projects:');
    res.json({ success: true, count: result.count });
  } catch (err) { next(err); }
};

export const trackClick = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.projectClick.create({ data: { projectId: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};
