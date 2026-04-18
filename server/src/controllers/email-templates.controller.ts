import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { renderTemplate, renderSubject, FALLBACK_TEMPLATES } from '../services/email-template.service.js';
import { emailService } from '../services/email.service.js';

// ─── List all templates ───────────────────────────────────────────────────────

export const listTemplates = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await prisma.emailTemplate.findMany({ orderBy: { key: 'asc' } });
    res.json({ success: true, data: templates });
  } catch (err) { next(err); }
};

// ─── Get single template ─────────────────────────────────────────────────────

export const getTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!tpl) throw new AppError('Template not found', 404);
    res.json({ success: true, data: tpl });
  } catch (err) { next(err); }
};

// ─── Create template ─────────────────────────────────────────────────────────

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key, name, subject, html, text, variables } = req.body;
    if (!key || !name || !subject || !html) throw new AppError('key, name, subject, and html are required', 400);

    // Auto-extract variables from html+subject if not provided
    const allContent = `${subject} ${html}`;
    const autoVars = variables ?? (allContent.match(/\{\{(\w+)\}\}/g) ?? [])
      .map((v: string) => v.slice(2, -2))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    const tpl = await prisma.emailTemplate.create({
      data: { key: key.toLowerCase().replace(/\s+/g, '_'), name, subject, html, text: text || null, variables: autoVars },
    });
    res.status(201).json({ success: true, data: tpl });
  } catch (err) { next(err); }
};

// ─── Update template ─────────────────────────────────────────────────────────

export const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, subject, html, text, variables } = req.body;

    const existing = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError('Template not found', 404);

    const allContent = `${subject ?? existing.subject} ${html ?? existing.html}`;
    const autoVars = variables ?? (allContent.match(/\{\{(\w+)\}\}/g) ?? [])
      .map((v: string) => v.slice(2, -2))
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

    const tpl = await prisma.emailTemplate.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name    !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(html    !== undefined && { html }),
        ...(text    !== undefined && { text: text || null }),
        variables: autoVars,
        updatedAt: new Date(),
      },
    });
    res.json({ success: true, data: tpl });
  } catch (err) { next(err); }
};

// ─── Delete template (system templates cannot be deleted) ────────────────────

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!tpl) throw new AppError('Template not found', 404);
    if (tpl.isSystem) throw new AppError('System templates cannot be deleted. You may edit them instead.', 403);
    await prisma.emailTemplate.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── Reset template to default ───────────────────────────────────────────────

export const resetTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!tpl) throw new AppError('Template not found', 404);

    const fallback = FALLBACK_TEMPLATES[tpl.key];
    if (!fallback) throw new AppError('No default template available for this key', 404);

    const allContent = `${fallback.subject} ${fallback.html}`;
    const variables = (allContent.match(/\{\{(\w+)\}\}/g) ?? [])
      .map(v => v.slice(2, -2))
      .filter((v, i, a) => a.indexOf(v) === i);

    const updated = await prisma.emailTemplate.update({
      where: { id: String(req.params.id) },
      data: { subject: fallback.subject, html: fallback.html, variables, updatedAt: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ─── Preview (render with sample variables) ──────────────────────────────────

export const previewTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!tpl) throw new AppError('Template not found', 404);

    // Merge provided sample vars with sensible defaults
    const sampleVars: Record<string, string> = {
      name:       'Jane Smith',
      email:      'jane@example.com',
      subject:    'Sample Inquiry Subject',
      message:    'This is a sample message body for preview purposes.',
      preview:    'This is a sample message body for preview purposes.',
      service:    'Professional Plan',
      amount:     '$4,500',
      date:       new Date().toLocaleDateString(),
      receipt_id: 'RCP-00001234',
      portal_url: 'http://customer.localhost:5173',
      reply:      'Thank you for your message. I will get back to you shortly.',
      ...((req.body.vars as Record<string, string>) ?? {}),
    };

    const renderedSubject = renderSubject(tpl.subject, sampleVars);
    const renderedHtml    = renderTemplate(tpl.html, sampleVars);

    res.json({ success: true, data: { subject: renderedSubject, html: renderedHtml } });
  } catch (err) { next(err); }
};

// ─── Send test email ──────────────────────────────────────────────────────────

export const sendTestEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to } = req.body;
    if (!to) throw new AppError('Recipient email (to) is required', 400);

    const tpl = await prisma.emailTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!tpl) throw new AppError('Template not found', 404);

    const sampleVars: Record<string, string> = {
      name:       'Test User',
      email:      to,
      subject:    'Test Subject',
      message:    'This is a test message sent from the admin panel.',
      preview:    'This is a test message sent from the admin panel.',
      service:    'Professional Plan',
      amount:     '$4,500',
      date:       new Date().toLocaleDateString(),
      receipt_id: 'RCP-TEST-001',
      portal_url: 'http://customer.localhost:5173',
      reply:      'This is a test reply.',
      ...((req.body.vars as Record<string, string>) ?? {}),
    };

    const renderedSubject = renderSubject(tpl.subject, sampleVars);
    const renderedHtml    = renderTemplate(tpl.html, sampleVars);

    await emailService.sendEmail({ to, subject: `[TEST] ${renderedSubject}`, html: renderedHtml });

    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) { next(err); }
};
