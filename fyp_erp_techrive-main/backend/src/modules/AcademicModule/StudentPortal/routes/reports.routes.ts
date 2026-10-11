import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/reports.controller';

const router = Router();
router.use(authMiddleware);

router.get('/academic-progress', controller.getAcademicProgress);
router.get('/attendance', controller.getAttendanceAnalytics);

export default router;
