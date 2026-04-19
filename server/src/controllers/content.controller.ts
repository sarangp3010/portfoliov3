import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendInquiryEmails } from '../services/email.service.js';
import { notifyAdmin } from '../services/notification.service.js';
import path from 'path';
import fs from 'fs';

// ─── Services ────────────────────────────────────────────────────────────────
export const getServices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
};

export const createService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (data.features && typeof data.features === 'string') data.features = data.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
    const s = await prisma.service.create({ data });
    res.status(201).json({ success: true, data: s });
  } catch (err) { next(err); }
};

export const updateService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (data.features && typeof data.features === 'string') data.features = data.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
    const s = await prisma.service.update({ where: { id: String(req.params.id) }, data });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
};

export const deleteService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.service.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

export const deleteAllServices = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.service.deleteMany();
    res.json({ success: true, count: result.count, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Testimonials ────────────────────────────────────────────────────────────
export const getTestimonials = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const createTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await prisma.testimonial.create({ data: req.body });
    res.status(201).json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const updateTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const t = await prisma.testimonial.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
};

export const deleteTestimonial = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.testimonial.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

export const deleteAllTestimonials = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await prisma.testimonial.deleteMany();
    res.json({ success: true, count: result.count, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Resume ──────────────────────────────────────────────────────────────────
export const getActiveResume = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const resume = await prisma.resume.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
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
    res.status(201).json({ success: true, data: resume });
  } catch (err) { next(err); }
};

export const downloadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const where = status ? { status: status as any } : {};
    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.inquiry.count({ where }),
    ]);
    res.json({ success: true, data: { inquiries, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const updateInquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const inq = await prisma.inquiry.update({ where: { id: String(req.params.id) }, data: { status } });
    res.json({ success: true, data: inq });
  } catch (err) { next(err); }
};

export const deleteInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.inquiry.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};
