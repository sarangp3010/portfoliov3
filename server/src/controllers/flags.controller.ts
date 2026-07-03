import { Request, Response, NextFunction } from 'express';
import { getAllFlags, getAllFlagsDetailed, setFlag, updateFlag } from '../services/flags.service.js';

export const listFlags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json({ success: true, data: await getAllFlagsDetailed() }); } catch (err) { next(err); }
};

export const toggleFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = String(req.params.key);
    const { enabled } = req.body;
    const flag = await setFlag(key, Boolean(enabled));
    res.json({ success: true, data: flag });
  } catch (err) { next(err); }
};

export const patchFlag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const flag = await updateFlag(String(req.params.key), req.body);
    res.json({ success: true, data: flag });
  } catch (err) { next(err); }
};

// Public: returns map of key→boolean so the frontend can check flags
export const publicFlags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const map = await getAllFlags();
    res.json({ success: true, data: map });
  } catch (err) { next(err); }
};
