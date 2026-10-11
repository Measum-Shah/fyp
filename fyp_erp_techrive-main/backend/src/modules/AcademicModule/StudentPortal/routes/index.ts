import dashboardRoutes from './dashboard.routes';
import academicsRoutes from './academics.routes';
import timetableRoutes from './timetable.routes';
import feeRoutes from './fee.routes';
import assignmentsRoutes from './assignments.routes';
import notificationsRoutes from './notifications.routes';
import settingsRoutes from './settings.routes';
import enrollmentRoutes from './enrollment.routes';
import reportsRoutes from './reports.routes';
import fineRoutes from './fine.routes';

import { Router } from 'express';
const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/academics', academicsRoutes);
router.use('/timetable', timetableRoutes);
router.use('/fee', feeRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/settings', settingsRoutes);
router.use('/enrollment', enrollmentRoutes);
router.use('/reports', reportsRoutes);
router.use('/fines', fineRoutes);

export default router;
