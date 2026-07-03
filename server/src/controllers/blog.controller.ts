import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { saveVersion } from '../services/version.service.js';
import { cached, cacheDeletePattern } from '../services/cache.service.js';

const slugify = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
    const limit = Math.min(20, parseInt(req.query.limit as string ?? '9', 10));
    const tag = req.query.tag as string | undefined;
    const isAdmin = (req as any).user?.role === 'ADMIN';
    const where = { ...(isAdmin ? {} : { published: true }), ...(tag ? { tags: { has: tag } } : {}) };
    const cacheKey = `posts:${page}:${limit}:${tag ?? ''}`;

    if (!isAdmin) {
      const cached_ = await cached(cacheKey, async () => {
        const [posts, total] = await Promise.all([
          prisma.blogPost.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { publishedAt: 'desc' }, select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, tags: true, readingTime: true, views: true, published: true, publishedAt: true, createdAt: true } }),
          prisma.blogPost.count({ where }),
        ]);
        return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
      }, 3 * 60_000);
      res.json({ success: true, data: cached_ }); return;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { publishedAt: 'desc' }, select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, tags: true, readingTime: true, views: true, published: true, publishedAt: true, createdAt: true } }),
      prisma.blogPost.count({ where }),
    ]);
    res.json({ success: true, data: { posts, total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = (req as any).user?.role === 'ADMIN';
    const slug = String(req.params.slug);
    const post = isAdmin
      ? await prisma.blogPost.findFirst({ where: { slug } })
      : await cached(`blog:post:${slug}`, () => prisma.blogPost.findFirst({ where: { slug, published: true } }), 5 * 60_000);
    if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }
    prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

export const getTags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await cached('blog:tags', async () => {
      const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { tags: true } });
      return [...new Set(posts.flatMap(p => p.tags))].sort();
    }, 5 * 60_000);
    res.json({ success: true, data: tags });
  } catch (err) { next(err); }
};

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (!data.slug && data.title) data.slug = slugify(data.title);
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (data.published && !data.publishedAt) data.publishedAt = new Date();
    const post = await prisma.blogPost.create({ data });
    await Promise.all([cacheDeletePattern('posts:'), cacheDeletePattern('blog:'), cacheDeletePattern('pdf:')]);
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: String(req.params.id) } });
    if (existing) {
      await saveVersion('BLOG', existing.id, existing.title, { title: existing.title, content: existing.content, excerpt: existing.excerpt, tags: existing.tags, readingTime: existing.readingTime, slug: existing.slug }, (req as any).user?.id);
    }
    const data = req.body;
    if (data.slug) data.slug = slugify(data.slug);
    if (data.tags && typeof data.tags === 'string') data.tags = data.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (data.published && !data.publishedAt) data.publishedAt = new Date();
    const post = await prisma.blogPost.update({ where: { id: String(req.params.id) }, data });
    await Promise.all([cacheDeletePattern('posts:'), cacheDeletePattern('blog:'), cacheDeletePattern('pdf:')]);
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.blogPost.delete({ where: { id: String(req.params.id) } });
    await Promise.all([cacheDeletePattern('posts:'), cacheDeletePattern('blog:'), cacheDeletePattern('pdf:')]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const deleteAllPosts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.blogPost.deleteMany();
    await Promise.all([cacheDeletePattern('posts:'), cacheDeletePattern('blog:'), cacheDeletePattern('pdf:')]);
    res.json({ success: true, count: result.count });
  } catch (err) { next(err); }
};
