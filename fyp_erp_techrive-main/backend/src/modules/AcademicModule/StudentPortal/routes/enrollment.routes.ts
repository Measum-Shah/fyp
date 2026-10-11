import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/enrollment.controller';

const router = Router();
router.use(authMiddleware);

router.get('/courses/available', controller.getAvailableCourses);
router.post('/register', controller.registerCourse);
router.get('/status', controller.getEnrollmentStatus);

export default router;
