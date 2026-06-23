import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { postController, uploadPostImage } from '../controllers/post.controller.js';

export const postRoutes = Router();

postRoutes.get('/users/:id/posts', authenticate, postController.getByUser);
postRoutes.post('/users/me/posts', authenticate, uploadPostImage, postController.create);
postRoutes.put('/posts/:id', authenticate, uploadPostImage, postController.update);
postRoutes.delete('/posts/:id', authenticate, postController.delete);
postRoutes.post('/posts/:id/like', authenticate, postController.like);
postRoutes.post('/posts/:id/view', authenticate, postController.view);
