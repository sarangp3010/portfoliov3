import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendInquiryEmails } from '../services/email.service.js';
import { notifyAdmin } from '../services/notification.service.js';
import { cached, cacheDeletePattern } from '../services/cache.service.js';
import path from 'path';
import fs from 'fs';

// ─── Services ────────────────────────────────────────────────────────────────
export const getServices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const services = await cached(
      'services:all',
      () => prisma.service.findMany({ orderBy: { order: 'asc' } }),
      5 * 60_000,
    );
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (data.features && typeof data.features === 'string') data.features = data.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
    const s = await prisma.service.create({ data });
    await Promise.all([cacheDeletePattern('services:'), cacheDeletePattern('payments:plans'), cacheDeletePattern('pdf:')]);
    res.status(201).json({ success: true, data: s });
  } catch (err) { next(err); }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (data.features && typeof data.features === 'string') data.features = data.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
    const s = await prisma.service.update({ where: { id: String(req.params.id) }, data });
    await Promise.all([cacheDeletePattern('services:'), cacheDeletePattern('payments:plans'), cacheDeletePattern('pdf:')]);
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.service.delete({ where: { id: String(req.params.id) } });
    await Promise.all([cacheDeletePattern('services:'), cacheDeletePattern('payments:plans'), cacheDeletePattern('pdf:')]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

export const deleteAllServices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.service.deleteMany();
    await Promise.all([cacheDeletePattern('services:'), cacheDeletePattern('payments:plans'), cacheDeletePattern('pdf:')]);
    res.json({ success: true, count: result.count, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Testimonials ────────────────────────────────────────────────────────────
export const getTestimonials = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await cached(
      'testimonials:all',
      () => prisma.testimonial.findMany({ orderBy: { order: 'asc' } }),
      5 * 60_000,
    );
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const createTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await prisma.testimonial.create({ data: req.body });
    await cacheDeletePattern('testimonials:');
    res.status(201).json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const updateTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await prisma.testimonial.update({ where: { id: String(req.params.id) }, data: req.body });
    await cacheDeletePattern('testimonials:');
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const deleteTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.testimonial.delete({ where: { id: String(req.params.id) } });
    await cacheDeletePattern('testimonials:');
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

export const deleteAllTestimonials = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.testimonial.deleteMany();
    await cacheDeletePattern('testimonials:');
    res.json({ success: true, count: result.count, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Resume ──────────────────────────────────────────────────────────────────
export const getActiveResume = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await cached(
      'resume:active',
      () => prisma.resume.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
      5 * 60_000,
    );
    res.json({ success: true, data: resume });
  } catch (err) { next(err); }
};

export const getAllResumes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: resumes });
  } catch (err) { next(err); }
};

export const uploadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const { version = new Date().getFullYear().toString() } = req.body;
    // Deactivate existing
    await prisma.resume.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const resume = await prisma.resume.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        version,
        isActive: true,
      },
    });
    await cacheDeletePattern('resume:');
    res.status(201).json({ success: true, data: resume });
  } catch (err) { next(err); }
};

export const downloadResume = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await prisma.resume.findFirst({ where: { isActive: true } });
    if (!resume) throw new AppError('No resume available', 404);
    prisma.resume.update({ where: { id: resume.id }, data: { downloadCount: { increment: 1 } } }).catch(() => {});
    const filePath = path.join(process.cwd(), resume.fileUrl.replace('/uploads/', 'uploads/'));
    if (!fs.existsSync(filePath)) throw new AppError('Resume file not found on server', 404);
    res.download(filePath, resume.fileName);
  } catch (err) { next(err); }
};

export const setActiveResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.resume.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const r = await prisma.resume.update({ where: { id: String(req.params.id) }, data: { isActive: true } });
    await cacheDeletePattern('resume:');
    res.json({ success: true, data: r });
  } catch (err) { next(err); }
};

export const deleteResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const r = await prisma.resume.findUnique({ where: { id: String(req.params.id) } });
    if (!r) throw new AppError('Not found', 404);
    const filePath = path.join(process.cwd(), r.fileUrl.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.resume.delete({ where: { id: String(req.params.id) } });
    await cacheDeletePattern('resume:');
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Inquiries ───────────────────────────────────────────────────────────────
export const submitInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message, serviceType } = req.body;
    if (!name || !email || !subject || !message) throw new AppError('All fields required', 400);
    const ip = req.ip ?? req.socket.remoteAddress;
    const inquiry = await prisma.inquiry.create({ data: { name, email, subject, message, serviceType, ipAddress: ip } });
    await cacheDeletePattern('inquiries:list:');
    sendInquiryEmails({ name, email, subject, message, serviceType }).catch(() => {});
    notifyAdmin('inquiry_created', `New inquiry from ${name}: "${subject}"`, { type: 'info', link: '/inquiries' }).catch(() => {});
    res.status(201).json({ success: true, data: inquiry, message: 'Message sent successfully!' });
  } catch (err) { next(err); }
};

export const getInquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10));
    const limit = 20;
    const status = req.query.status as string | undefined;
    const stage  = req.query.stage  as string | undefined;
    const where = {
      ...(status ? { status: status as any } : {}),
      ...(stage  ? { stage:  stage  as any } : {}),
    };
    const data = await cached(
      `inquiries:list:${page}:${status ?? 'all'}:${stage ?? 'all'}`,
      async () => {
        const [inquiries, total] = await Promise.all([
          prisma.inquiry.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
          prisma.inquiry.count({ where }),
        ]);
        return { inquiries, total, page, totalPages: Math.ceil(total / limit) };
      },
      60_000,
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateInquiryStage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id    = String(req.params.id);
    const stage = req.body.stage as string;
    const note  = req.body.note  as string | undefined;
    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    const [inq] = await prisma.$transaction([
      prisma.inquiry.update({ where: { id }, data: { stage: stage as any, stageUpdatedAt: new Date() } }),
      prisma.inquiryStageHistory.create({ data: { inquiryId: id, from: existing.stage, to: stage as any, note } }),
    ]);
    await cacheDeletePattern('inquiries:list:');
    res.json({ success: true, data: inq });
  } catch (err) { next(err); }
};

export const updateInquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const inq = await prisma.inquiry.update({ where: { id: String(req.params.id) }, data: { status } });
    await cacheDeletePattern('inquiries:list:');
    res.json({ success: true, data: inq });
  } catch (err) { next(err); }
};

export const deleteInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.inquiry.delete({ where: { id: String(req.params.id) } });
    await cacheDeletePattern('inquiries:list:');
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
