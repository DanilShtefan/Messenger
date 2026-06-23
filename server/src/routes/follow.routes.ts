import { Router } from 'express';
import { followController } from '../controllers/follow.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/feed', authenticate, followController.getFeed);
router.get('/:userId/status', authenticate, followController.getFollowStatus);
router.post('/:userId', authenticate, followController.toggleFollow);

export default router;
