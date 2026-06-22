import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { messageService } from '../services/message.service.js';

const sendSchema = z.object({
  content: z.string().min(1).max(5000),
  dialogId: z.string().uuid(),
});

export const messageController = {
  async getByDialog(req: Request, res: Response, next: NextFunction) {
    try {
      const dialogId = req.params.dialogId as string;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

      const result = await messageService.getByDialog(dialogId, req.user!.userId, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendSchema.parse(req.body);
      const message = await messageService.create(data.content, req.user!.userId, data.dialogId);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  },
};
