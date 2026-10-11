import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/assignments.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', controller.getAssignments);
router.post('/submit', controller.submitAssignment);
router.get('/:id/submissions', controller.getSubmissions);
router.get('/materials', controller.getMaterials);
router.get('/quizzes', controller.getQuizzes);

export default router;
