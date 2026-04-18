import { VersionType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

/** Save a snapshot before content is mutated */
export const saveVersion = async (
  contentType: VersionType,
  contentId: string,
  title: string,
  snapshot: Record<string, unknown>,
  changedBy?: string,
  changeNote?: string,
): Promise<void> => {
  try {
    const lastVersion = await prisma.contentVersion.findFirst({
      where: { contentType, contentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    await prisma.contentVersion.create({
      data: {
        contentType,
        contentId,
        version: (lastVersion?.version ?? 0) + 1,
        title,
        snapshot: snapshot as any,
        changedBy,
        changeNote,
      },
    });
  } catch { /* non-critical */ }
};

export const getVersionHistory = async (contentType: VersionType, contentId: string) => {
  return prisma.contentVersion.findMany({
    where: { contentType, contentId },
    orderBy: { version: 'desc' },
    select: {
      id: true, version: true, title: true,
      changedBy: true, changeNote: true, createdAt: true,
    },
  });
};

export const getVersionSnapshot = async (versionId: string) => {
  return prisma.contentVersion.findUnique({ where: { id: versionId } });
};
