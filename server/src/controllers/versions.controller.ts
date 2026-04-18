import { Request, Response, NextFunction } from 'express';
import { VersionType } from '@prisma/client';
import { getVersionHistory, getVersionSnapshot } from '../services/version.service.js';
import { prisma } from '../config/prisma.js';

export const listVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = String(req.params.type);
    const id   = String(req.params.id);
    if (!Object.values(VersionType).includes(type.toUpperCase() as VersionType)) {
      res.status(400).json({ success: false, error: 'Invalid content type' }); return;
    }
    const versions = await getVersionHistory(type.toUpperCase() as VersionType, id);
    res.json({ success: true, data: versions });
  } catch (err) { next(err); }
};

export const getVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const version = await getVersionSnapshot(String(req.params.versionId));
    if (!version) { res.status(404).json({ success: false, error: 'Version not found' }); return; }
    res.json({ success: true, data: version });
  } catch (err) { next(err); }
};

export const restoreVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const version = await getVersionSnapshot(String(req.params.versionId));
    if (!version) { res.status(404).json({ success: false, error: 'Version not found' }); return; }
    const { contentType, contentId, snapshot } = version;
    const data = snapshot as Record<string, unknown>;

    let restored: unknown;
    switch (contentType) {
      case 'BLOG':
        restored = await prisma.blogPost.update({ where: { id: contentId }, data: { title: data.title as string, content: data.content as string, excerpt: data.excerpt as string, tags: data.tags as string[], readingTime: data.readingTime as number } });
        break;
      case 'PROJECT':
        restored = await prisma.project.update({ where: { id: contentId }, data: { title: data.title as string, description: data.description as string, longDesc: data.longDesc as string | undefined, techStack: data.techStack as string[] } });
        break;
      case 'SERVICE':
        restored = await prisma.service.update({ where: { id: contentId }, data: { title: data.title as string, description: data.description as string, features: data.features as string[], price: data.price as string } });
        break;
      case 'PROFILE':
        const existing = await prisma.profile.findFirst();
        if (existing) restored = await prisma.profile.update({ where: { id: existing.id }, data: data as any });
        break;
    }
    res.json({ success: true, data: restored, message: `Restored to version ${version.version}` });
  } catch (err) { next(err); }
};
