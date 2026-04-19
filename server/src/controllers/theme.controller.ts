import { Request, Response, NextFunction } from 'express';
import { getTheme, updateTheme } from '../services/theme.service.js';
import { cached, cacheDelete } from '../services/cache.service.js';

export const fetchTheme = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const theme = await cached('theme:active', () => getTheme(), 10 * 60_000);
    res.json({ success: true, data: theme });
  }
  catch (err) { next(err); }
};

export const saveTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allowed = ['mode','primaryColor','accentColor','fontSans','fontMono','fontDisplay','borderRadius','animationSpeed','customCss'];
    const data: Record<string, string> = {};
    for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
    const theme = await updateTheme(data);
    await cacheDelete('theme:active');
    res.json({ success: true, data: theme });
  } catch (err) { next(err); }
};
