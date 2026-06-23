import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { postController, uploadPostImage } from '../controllers/post.controller.js';

export const postRoutes = Router();

postRoutes.get('/users/:id/posts', postController.getByUser);
postRoutes.post('/users/me/posts', authenticate, uploadPostImage, postController.create);
postRoutes.delete('/posts/:id', authenticate, postController.delete);
