import { Router } from 'express';
import { authMiddleware } from '../../../../middlewares/auth.middleware';
import * as controller from '../controllers/fee.controller';

const router = Router();
router.use(authMiddleware);

router.get('/dashboard', controller.get);
router.get('/workspace', controller.getPaymentWorkspace);
router.get('/history', controller.getPaymentHistory);
router.post('/pay', controller.payFee);

export default router;
