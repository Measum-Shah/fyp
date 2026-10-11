import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/settings.controller';

const router = Router();
router.use(authMiddleware);

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.post('/change-password', controller.changePassword);

export default router;
