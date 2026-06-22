import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const chatRoutes = Router();

chatRoutes.get('/', authenticate, chatController.getAll);
chatRoutes.get('/:id', authenticate, chatController.getById);
chatRoutes.post('/', authenticate, chatController.create);
chatRoutes.post('/direct', authenticate, chatController.getOrCreateDirect);
chatRoutes.post('/:id/read', authenticate, chatController.markAsRead);
