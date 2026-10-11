import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/dashboard.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.get);

export default router;
