import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { friendService } from '../services/friend.service.js';
import { isUserOnline } from '../socket/index.js';

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

function addOnline(users: any[]) {
  return users.map((u) => ({ ...u, isOnline: isUserOnline(u.id) }));
}

export const friendController = {
  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const friends = await friendService.getFriends(req.user!.userId);
      res.json(addOnline(friends));
    } catch (err) {
      next(err);
    }
  },

  async getIncomingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await friendService.getIncomingRequests(req.user!.userId);
      res.json(addOnline(requests));
    } catch (err) {
      next(err);
    }
  },

  async getSentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await friendService.getSentRequests(req.user!.userId);
      res.json(addOnline(requests));
    } catch (err) {
      next(err);
    }
  },

  async getSuggested(req: Request, res: Response, next: NextFunction) {
    try {
      const suggested = await friendService.getSuggested(req.user!.userId);
      res.json(addOnline(suggested));
    } catch (err) {
      next(err);
    }
  },

  async sendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdSchema.parse(req.body);
      const result = await friendService.sendRequest(req.user!.userId, userId);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdSchema.parse(req.body);
      await friendService.acceptRequest(req.user!.userId, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdSchema.parse(req.body);
      await friendService.rejectRequest(req.user!.userId, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async removeFriend(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = userIdSchema.parse(req.body);
      await friendService.removeFriend(req.user!.userId, userId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
