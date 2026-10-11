import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/notifications.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', controller.getNotifications);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);

export default router;
