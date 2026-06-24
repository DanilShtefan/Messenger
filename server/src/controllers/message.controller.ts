import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { messageService } from '../services/message.service.js';

const sendSchema = z.object({
  content: z.string().min(1).max(5000),
  dialogId: z.string().uuid(),
  forwardedFrom: z.object({ senderName: z.string(), content: z.string(), senderId: z.string() }).nullable().optional(),
});

const updateSchema = z.object({
  content: z.string().min(1).max(5000),
});

const reactSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export const messageController = {
  async getByDialog(req: Request, res: Response, next: NextFunction) {
    try {
      const dialogId = req.params.dialogId as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

      const result = await messageService.getByDialog(dialogId, req.user!.userId, cursor, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = updateSchema.parse(req.body);
      const message = await messageService.update(req.params.messageId as string, req.user!.userId, content);
      res.json(message);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendSchema.parse(req.body);
      const message = await messageService.create(data.content, req.user!.userId, data.dialogId, data.forwardedFrom);
      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  },

  async react(req: Request, res: Response, next: NextFunction) {
    try {
      const { emoji } = reactSchema.parse(req.body);
      const message = await messageService.toggleReaction(req.params.messageId as string, req.user!.userId, emoji);
      res.json(message);
    } catch (err) {
      next(err);
    }
  },
};
