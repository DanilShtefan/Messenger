import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { commentService } from '../services/comment.service.js';

const createSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().optional().nullable(),
});

export const commentController = {
  async getByPost(req: Request, res: Response, next: NextFunction) {
    try {
      const postId = req.params.postId as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const result = await commentService.getByPost(postId, cursor, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, parentId } = createSchema.parse(req.body);
      const comment = await commentService.create(req.params.postId as string, req.user!.userId, content, parentId);
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await commentService.delete(req.params.commentId as string, req.user!.userId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
