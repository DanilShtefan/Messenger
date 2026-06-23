import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { postService } from '../services/post.service.js';

const createSchema = z.object({
  content: z.string().min(1).max(1000),
});

const postImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve('uploads/posts');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const postImageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

export const uploadPostImage = multer({
  storage: postImageStorage,
  fileFilter: postImageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

export const postController = {
  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const result = await postService.getByUser(userId, cursor, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = createSchema.parse(req.body);
      const imageUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;
      const post = await postService.create(req.user!.userId, content, imageUrl);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await postService.delete(req.params.id as string, req.user!.userId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
