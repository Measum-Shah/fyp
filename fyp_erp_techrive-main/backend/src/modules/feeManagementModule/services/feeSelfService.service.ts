import { AppError } from "../utils/fee.helpers";
import {
  getStudentFeeDashboard,
  getInvoiceView,
  getReceiptView,
} from "./studentFeeRecord.service";
import {
  getPaymentWorkspace,
  processPayment,
  listStudentPaymentHistory,
} from "./paymentProcessing.service";
import {
  assertCapability,
  assertStudentScope,
  type FeeActor,
} from "./feeAccess.service";
import { FEE_CAPABILITIES } from "../constants/feeAccess.constants";

const pickScopedStudentId = (actor: FeeActor, requested?: number) => {
  assertCapability(actor, FEE_CAPABILITIES.VIEW_OWN_FEES);
  if (!actor.linkedStudentIds.length) {
    throw new AppError(
      "No linked student fee profile found for your account",
      404
    );
  }
  if (requested !== undefined && requested !== null) {
    assertStudentScope(actor, requested);
    return requested;
  }
  return actor.linkedStudentIds[0]!;
};

export const getMyFeeDashboard = async (
  actor: FeeActor,
  studentId?: number
) => {
  const id = pickScopedStudentId(actor, studentId);
  const dashboard = await getStudentFeeDashboard(id);
  return {
    student_id: id,
    linked_student_ids: actor.linkedStudentIds,
    dashboard,
  };
};

export const getMyPaymentWorkspace = async (
  actor: FeeActor,
  studentId?: number
) => {
  const id = pickScopedStudentId(actor, studentId);
  return getPaymentWorkspace(id);
};

export const getMyInvoice = async (
  actor: FeeActor,
  basicId: number
) => {
  assertCapability(actor, FEE_CAPABILITIES.VIEW_OWN_FEES);
  const invoice = await getInvoiceView(basicId);
  const studentId = Number((invoice as { student?: { id?: number } }).student?.id);
  assertStudentScope(actor, studentId);
  return invoice;
};

export const getMyReceipt = async (actor: FeeActor, basicId: number) => {
  assertCapability(actor, FEE_CAPABILITIES.VIEW_OWN_FEES);
  const receipt = await getReceiptView(basicId);
  const studentId = Number((receipt as { student?: { id?: number } }).student?.id);
  assertStudentScope(actor, studentId);
  return receipt;
};

export const getMyPaymentHistory = async (
  actor: FeeActor,
  studentId?: number
) => {
  const id = pickScopedStudentId(actor, studentId);
  return listStudentPaymentHistory(id);
};

export const payMyFees = async (
  actor: FeeActor,
  body: {
    student_id?: number;
    fee_master_basic_id: number;
    amount: number;
    payment_mode: string;
    fee_masters_id?: number;
    note?: string | null;
    reference_no?: string | null;
    paid_date?: string | null;
  },
  userId: number
) => {
  assertCapability(actor, FEE_CAPABILITIES.PAY_OWN_FEES);
  const studentId = pickScopedStudentId(actor, body.student_id);
  // Force ownership — ignore any mismatched body.student_id
  return processPayment(
    {
      student_id: studentId,
      fee_master_basic_id: body.fee_master_basic_id,
      amount: body.amount,
      payment_mode: body.payment_mode as never,
      fee_masters_id: body.fee_masters_id,
      note: body.note,
      reference_no: body.reference_no,
      paid_date: body.paid_date,
    },
    userId
  );
};
