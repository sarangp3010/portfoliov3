import { Request, Response, NextFunction } from 'express';
import { getTheme, updateTheme } from '../services/theme.service.js';

export const fetchTheme = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json({ success: true, data: await getTheme() }); }
  catch (err) { next(err); }
};

export const saveTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ['mode','primaryColor','accentColor','fontSans','fontMono','fontDisplay','borderRadius','animationSpeed','customCss'];
    const data: Record<string, string> = {};
    for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
    res.json({ success: true, data: await updateTheme(data) });
  } catch (err) { next(err); }
};
