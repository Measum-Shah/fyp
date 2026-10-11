import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';
import * as feeSelfService from '../../../feeManagementModule/services/feeSelfService.service';
import type { FeeActor } from '../../../feeManagementModule/services/feeAccess.service';
import { FEE_CAPABILITIES } from '../../../feeManagementModule/constants/feeAccess.constants';

const buildActor = (userId: number, studentId: number): FeeActor => ({
  userId,
  userType: 'student',
  roleId: null,
  name: null,
  email: null,
  feeRole: 'student',
  linkedStudentIds: [studentId],
  teacherClassIds: [],
  branchId: 1,
});

export const get = async (userId: number) => {
  const student = await getStudentByUser(userId);
  const actor = buildActor(userId, student.id);
  const dashboard = await feeSelfService.getMyFeeDashboard(actor, student.id);
  return dashboard;
};

export const getPaymentWorkspace = async (userId: number) => {
  const student = await getStudentByUser(userId);
  const actor = buildActor(userId, student.id);
  return await feeSelfService.getMyPaymentWorkspace(actor, student.id);
};

export const getPaymentHistory = async (userId: number) => {
  const student = await getStudentByUser(userId);
  const actor = buildActor(userId, student.id);
  return await feeSelfService.getMyPaymentHistory(actor, student.id);
};

export const payFee = async (userId: number, body: any) => {
  const student = await getStudentByUser(userId);
  const actor = buildActor(userId, student.id);
  return await feeSelfService.payMyFees(actor, { ...body, student_id: student.id }, userId);
};
