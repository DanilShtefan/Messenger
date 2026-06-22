import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const messageRoutes = Router();

messageRoutes.get('/:dialogId', authenticate, messageController.getByDialog);
messageRoutes.post('/', authenticate, messageController.create);
