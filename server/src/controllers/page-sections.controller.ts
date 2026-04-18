import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SectionStyle {
  primaryColor?: string;
  bgColor?: string;
  textColor?: string;
  gradient?: string;
  spacing?: 'compact' | 'normal' | 'spacious';
}

export interface SectionAnimation {
  type?: 'none' | 'fade' | 'slide' | 'scale' | 'blur';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
  trigger?: 'load' | 'scroll' | 'hover';
}

// ─── Default seeds ────────────────────────────────────────────────────────────

interface DefaultSection {
  page: string;
  key: string;
  sectionType: string;
  order: number;
  title?: string;
  subtitle?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  icon?: string;
  variant: string;
  animation: SectionAnimation;
  style: SectionStyle;
  isVisible?: boolean;
}

export const DEFAULT_SECTIONS: DefaultSection[] = [
  {
    page: 'home', key: 'hero', sectionType: 'hero', order: 0,
    title: 'Full-Stack Developer',
    subtitle: 'Building scalable web applications with modern technology',
    body: 'Available for freelance projects and consulting.',
    ctaText: 'View Services', ctaLink: '/services',
    icon: '⚡',
    variant: 'default',
    animation: { type: 'fade', direction: 'up', duration: 'normal', delay: 0, trigger: 'load' },
    style: { spacing: 'spacious' },
  },
  {
    page: 'home', key: 'stats', sectionType: 'stats', order: 1,
    title: 'By the numbers',
    variant: 'default',
    animation: { type: 'slide', direction: 'up', duration: 'normal', delay: 0.1, trigger: 'scroll' },
    style: { spacing: 'normal' },
  },
  {
    page: 'home', key: 'projects', sectionType: 'projects', order: 2,
    title: 'Featured Projects',
    subtitle: 'Selected work from recent engagements',
    variant: 'grid',
    animation: { type: 'fade', direction: 'up', duration: 'normal', delay: 0, trigger: 'scroll' },
    style: { spacing: 'normal' },
  },
  {
    page: 'home', key: 'cta', sectionType: 'cta', order: 3,
    title: "Ready to build something?",
    subtitle: "Let's discuss your project",
    ctaText: 'Get in touch', ctaLink: '/services',
    variant: 'centered',
    animation: { type: 'scale', direction: 'up', duration: 'normal', delay: 0, trigger: 'scroll' },
    style: { spacing: 'spacious' },
  },
  {
    page: 'services', key: 'hero', sectionType: 'hero', order: 0,
    title: 'Services & Pricing',
    subtitle: 'Clear scope. Fixed price. No surprises.',
    variant: 'centered',
    animation: { type: 'fade', direction: 'up', duration: 'normal', delay: 0, trigger: 'load' },
    style: { spacing: 'normal' },
  },
];

// ─── Public: get visible sections for a page ──────────────────────────────────

export const getPublicSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = String(req.params.page);
    const sections = await prisma.pageSection.findMany({
      where: { page, isVisible: true },
      orderBy: { order: 'asc' },
    });
    const defaults = DEFAULT_SECTIONS.filter(s => s.page === page);
    res.json({ success: true, data: sections.length > 0 ? sections : defaults });
  } catch (err) { next(err); }
};

// ─── Admin: get all sections for a page (seeds defaults on first visit) ───────

export const getAdminSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = String(req.params.page);
    let sections = await prisma.pageSection.findMany({
      where: { page },
      orderBy: { order: 'asc' },
    });
    if (sections.length === 0) {
      const defaults = DEFAULT_SECTIONS.filter(s => s.page === page);
      if (defaults.length > 0) {
        sections = await Promise.all(
          defaults.map(d =>
            prisma.pageSection.create({
              data: {
                page:        d.page,
                key:         d.key,
                sectionType: d.sectionType,
                order:       d.order,
                title:       d.title,
                subtitle:    d.subtitle,
                body:        d.body,
                ctaText:     d.ctaText,
                ctaLink:     d.ctaLink,
                icon:        d.icon,
                variant:     d.variant,
                animation:   d.animation as object,
                style:       d.style as object,
                content:     {},
                isVisible:   d.isVisible ?? true,
              },
            })
          )
        );
      }
    }
    res.json({ success: true, data: sections });
  } catch (err) { next(err); }
};

// ─── Admin: list all configured pages ────────────────────────────────────────

export const listPages = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await prisma.pageSection.groupBy({
      by: ['page'],
      _count: { page: true },
    });
    const configured = rows.map(r => r.page);
    const all = [...new Set([...configured, 'home', 'services'])];
    res.json({ success: true, data: all });
  } catch (err) { next(err); }
};

// ─── Admin: create section ────────────────────────────────────────────────────

export const createSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page, key, sectionType, title, subtitle, body, ctaText, ctaLink,
      icon, imageUrl, content, style, animation, variant,
      mobileHide, desktopHide, isVisible, order,
    } = req.body as Record<string, unknown>;

    if (!page || !key || !sectionType) {
      throw new AppError('page, key, and sectionType are required', 400);
    }

    const section = await prisma.pageSection.create({
      data: {
        page:        String(page),
        key:         String(key),
        sectionType: String(sectionType),
        title:       title     ? String(title)     : undefined,
        subtitle:    subtitle  ? String(subtitle)  : undefined,
        body:        body      ? String(body)      : undefined,
        ctaText:     ctaText   ? String(ctaText)   : undefined,
        ctaLink:     ctaLink   ? String(ctaLink)   : undefined,
        icon:        icon      ? String(icon)      : undefined,
        imageUrl:    imageUrl  ? String(imageUrl)  : undefined,
        content:     (content  as object)    ?? {},
        style:       (style    as object)    ?? {},
        animation:   (animation as object)  ?? {},
        variant:     variant   ? String(variant)   : 'default',
        mobileHide:  Boolean(mobileHide),
        desktopHide: Boolean(desktopHide),
        isVisible:   isVisible !== undefined ? Boolean(isVisible) : true,
        order:       order     ? Number(order)     : 0,
      },
    });
    res.status(201).json({ success: true, data: section });
  } catch (err) { next(err); }
};

// ─── Admin: update section ────────────────────────────────────────────────────

export const updateSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.pageSection.findUnique({ where: { id } });
    if (!existing) throw new AppError('Section not found', 404);

    const body = req.body as Record<string, unknown>;
    const allowedFields = [
      'title', 'subtitle', 'body', 'ctaText', 'ctaLink', 'icon', 'imageUrl',
      'content', 'style', 'animation', 'variant', 'mobileHide',
      'desktopHide', 'isVisible', 'order', 'sectionType',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field];
    }

    const section = await prisma.pageSection.update({ where: { id: String(req.params.id) }, data });
    res.json({ success: true, data: section });
  } catch (err) { next(err); }
};

// ─── Admin: delete section ────────────────────────────────────────────────────

export const deleteSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.pageSection.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Admin: reorder sections ──────────────────────────────────────────────────

export const reorderSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order } = req.body as { order: { id: string; order: number }[] };
    if (!Array.isArray(order)) throw new AppError('order array required', 400);
    await Promise.all(
      order.map(({ id, order: pos }) =>
        prisma.pageSection.update({ where: { id }, data: { order: pos } })
      )
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Admin: toggle visibility ─────────────────────────────────────────────────

export const toggleSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.pageSection.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError('Section not found', 404);
    const section = await prisma.pageSection.update({
      where: { id: String(req.params.id) },
      data:  { isVisible: !existing.isVisible },
    });
    res.json({ success: true, data: section });
  } catch (err) { next(err); }
};
