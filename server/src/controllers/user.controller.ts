import path from 'node:path';
import fs from 'node:fs';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service.js';
import { isUserOnline, getUserCurrentTrack, getUserCurrentMovie } from '../socket/index.js';

const updateSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  about: z.string().max(256).optional().nullable(),
});

export const userController = {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id as string, req.user?.userId);
      const currentTrack = getUserCurrentTrack(req.params.id as string);
      const currentMovie = getUserCurrentMovie(req.params.id as string);
      res.json({ ...user, isOnline: isUserOnline(user.id), currentTrack, currentMovie });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const user = await userService.update(req.user!.userId, data, req.user!.userId);
      res.json({ ...user, isOnline: isUserOnline(user.id) });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file provided' });
        return;
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const currentUser = await userService.getById(req.user!.userId, req.user!.userId);

      if (currentUser.avatarUrl?.startsWith('/uploads/')) {
        const oldPath = path.resolve('.' + currentUser.avatarUrl);
        fs.unlink(oldPath, () => {});
      }

      const user = await userService.update(req.user!.userId, { avatarUrl }, req.user!.userId);
      res.json({ ...user, isOnline: isUserOnline(user.id) });
    } catch (err) {
      next(err);
    }
  },
};
