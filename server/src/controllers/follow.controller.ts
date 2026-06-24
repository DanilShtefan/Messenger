import { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { followService } from '../services/follow.service.js';

export const followController = {
  async toggleFollow(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId as string;
      const currentUserId = req.user!.userId;
      const result = await followService.toggleFollow(currentUserId, targetUserId);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  async getFollowStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId as string;
      const currentUserId = req.user!.userId;
      const isFollowing = await followService.isFollowing(currentUserId, targetUserId);
      res.json({ isFollowing });
    } catch (e) {
      next(e);
    }
  },

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const feed = await followService.getFeed(currentUserId, cursor, limit);
      res.json(feed);
    } catch (e) {
      next(e);
    }
  },
};
