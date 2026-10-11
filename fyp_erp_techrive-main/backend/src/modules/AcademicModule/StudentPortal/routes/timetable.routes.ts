import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/timetable.controller';

const router = Router();
router.use(authMiddleware);

router.get('/schedule', controller.getTimetable);
router.get('/attendance', controller.getAttendance);

export default router;
