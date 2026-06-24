import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service.js';

const createSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1),
  name: z.string().min(1).max(100).optional(),
});

const directSchema = z.object({
  participantId: z.string().uuid(),
});

const participantSchema = z.object({
  userId: z.string().uuid(),
});

export const chatController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const dialogs = await chatService.getUserDialogs(req.user!.userId);
      res.json(dialogs);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const dialog = await chatService.getById(req.params.id as string, req.user!.userId);
      res.json(dialog);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { participantIds, name } = createSchema.parse(req.body);
      const dialog = await chatService.create([req.user!.userId, ...participantIds], name);
      res.status(201).json(dialog);
    } catch (err) {
      next(err);
    }
  },

  async getOrCreateDirect(req: Request, res: Response, next: NextFunction) {
    try {
      const { participantId } = directSchema.parse(req.body);
      const dialog = await chatService.getOrCreateDirect(req.user!.userId, participantId);
      res.json(dialog);
    } catch (err) {
      next(err);
    }
  },

  async addParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = participantSchema.parse(req.body);
      const dialog = await chatService.addParticipant(req.params.id as string, userId, req.user!.userId);
      res.json(dialog);
    } catch (err) {
      next(err);
    }
  },

  async removeParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      await chatService.removeParticipant(req.params.id as string, req.params.userId as string, req.user!.userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await chatService.markAsRead(req.params.id as string, req.user!.userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
