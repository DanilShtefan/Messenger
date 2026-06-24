import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { commentController } from '../controllers/comment.controller.js';

export const commentRoutes = Router();

commentRoutes.get('/posts/:postId/comments', authenticate, commentController.getByPost);
commentRoutes.post('/posts/:postId/comments', authenticate, commentController.create);
commentRoutes.delete('/comments/:commentId', authenticate, commentController.delete);
