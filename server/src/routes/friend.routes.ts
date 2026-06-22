import { Router } from 'express';
import { friendController } from '../controllers/friend.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const friendRoutes = Router();

friendRoutes.get('/', authenticate, friendController.getFriends);
friendRoutes.get('/incoming', authenticate, friendController.getIncomingRequests);
friendRoutes.get('/sent', authenticate, friendController.getSentRequests);
friendRoutes.get('/suggested', authenticate, friendController.getSuggested);
friendRoutes.post('/add', authenticate, friendController.sendRequest);
friendRoutes.post('/accept', authenticate, friendController.acceptRequest);
friendRoutes.post('/reject', authenticate, friendController.rejectRequest);
friendRoutes.post('/remove', authenticate, friendController.removeFriend);
