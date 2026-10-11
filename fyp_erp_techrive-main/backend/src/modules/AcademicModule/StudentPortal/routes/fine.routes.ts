import { Router } from 'express';
import { getStudentFines, getStudentFineById } from '../../controllers/fine.controller';

const router = Router();

router.get('/', getStudentFines);
router.get('/:id', getStudentFineById);

export default router;
