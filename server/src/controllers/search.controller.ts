import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../types/index.js';
import { cached } from '../services/cache.service.js';

const MIN_LEN = 2;
const MAX_RESULTS_PER_TYPE = 5;

export const globalSearch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string ?? '').trim();
    if (q.length < MIN_LEN) {
      res.json({ success: true, data: { query: q, results: {} } });
      return;
    }

    const cacheKey = `search:admin:${q.toLowerCase()}`;
    const data = await cached(cacheKey, async () => {
      const contains = (field: string) => ({ contains: field, mode: 'insensitive' as const });
      const [projects, posts, services, inquiries, customers, testimonials] = await Promise.all([
        prisma.project.findMany({
          where: { OR: [{ title: contains(q) }, { description: contains(q) }] },
          select: { id: true, title: true, description: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
        prisma.blogPost.findMany({
          where: { OR: [{ title: contains(q) }, { excerpt: contains(q) }] },
          select: { id: true, title: true, excerpt: true, slug: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
        prisma.service.findMany({
          where: { OR: [{ title: contains(q) }, { description: contains(q) }] },
          select: { id: true, title: true, description: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
        prisma.inquiry.findMany({
          where: { OR: [{ name: contains(q) }, { email: contains(q) }, { subject: contains(q) }] },
          select: { id: true, name: true, email: true, subject: true, status: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
        prisma.customer.findMany({
          where: { OR: [{ name: contains(q) }, { email: contains(q) }] },
          select: { id: true, name: true, email: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
        prisma.testimonial.findMany({
          where: { OR: [{ name: contains(q) }, { content: contains(q) }, { company: contains(q) }] },
          select: { id: true, name: true, content: true, company: true },
          take: MAX_RESULTS_PER_TYPE,
        }),
      ]);

      return {
        query: q,
        results: {
          projects:     projects.map(p => ({ id: p.id, label: p.title, sub: p.description?.slice(0, 80), href: `/projects` })),
          posts:        posts.map(p => ({ id: p.id, label: p.title, sub: p.excerpt?.slice(0, 80), href: `/blog` })),
          services:     services.map(s => ({ id: s.id, label: s.title, sub: s.description?.slice(0, 80), href: `/services` })),
          inquiries:    inquiries.map(i => ({ id: i.id, label: i.subject, sub: `${i.name} · ${i.email}`, href: `/inquiries` })),
          customers:    customers.map(c => ({ id: c.id, label: c.name, sub: c.email, href: `/customers` })),
          testimonials: testimonials.map(t => ({ id: t.id, label: t.name, sub: t.content?.slice(0, 80), href: `/testimonials` })),
        },
      };
    }, 30_000); // 30-second cache per query

    res.json({ success: true, data });
  } catch (err) { next(err); }
};
