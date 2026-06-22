import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';

export const userRoutes = Router();

userRoutes.get('/:id', authenticate, userController.getById);
userRoutes.patch('/me', authenticate, userController.updateMe);
userRoutes.post('/me/avatar', authenticate, (req: Request, res: Response, next: NextFunction) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      console.error('[Upload error]', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ message: 'File too large. Max 5MB allowed' });
          return;
        }
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }
    next();
  });
}, userController.uploadAvatar);
