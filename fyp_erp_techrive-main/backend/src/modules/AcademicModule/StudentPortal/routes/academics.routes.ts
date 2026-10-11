import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/academics.controller';

const router = Router();
router.use(authMiddleware);

router.get('/courses', controller.getCourses);
router.get('/results', controller.getResults);
router.get('/cgpa', controller.getCGPA);
router.get('/gradebook', controller.getGradebook);
router.get('/transcript', controller.getTranscript);

export default router;
