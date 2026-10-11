import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError, sendSuccess, toInt } from "../utils/fee.helpers";
import * as sectionService from "../services/feeSection.service";
import * as sectionPrintService from "../services/feeSectionPrint.service";
import * as erpFeeHeadService from "../services/erpFeeHead.service";
import * as headService from "../services/feeHead.service";
import * as termService from "../services/feeTerm.service";
import * as installmentService from "../services/installment.service";
import * as structureService from "../services/feeStructure.service";
import * as assignmentService from "../services/feeAssignment.service";
import * as lookupService from "../services/feeLookup.service";
import * as studentFeeService from "../services/studentFeeRecord.service";
import * as paymentService from "../services/paymentProcessing.service";
import * as discountService from "../services/discountConcession.service";
import * as lateFeeService from "../services/lateFeeManagement.service";
import * as notificationService from "../services/feeNotification.service";
import * as reportingService from "../services/feeReporting.service";
import { listFeeAuditTrail } from "../services/feeAudit.service";
import { getFeeAccessProfile as loadFeeAccessProfile } from "../services/feeAccess.service";
import * as selfService from "../services/feeSelfService.service";
import type { FeeAuthRequest } from "../middlewares/feeAccess.middleware";

const userId = (req: AuthRequest) => req.user?.id || 0;

const handle = async (
  res: Response,
  next: NextFunction,
  fn: () => Promise<unknown>,
  message: string,
  status = 200
) => {
  try {
    const data = await fn();
    return sendSuccess(res, data, message, status);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

const listParams = (req: AuthRequest) => ({
  page: toInt(req.query.page, 1),
  limit: toInt(req.query.limit, 20),
  search: req.query.search ? String(req.query.search) : undefined,
  status: req.query.status !== undefined ? String(req.query.status) : undefined,
  branch_id: toInt(req.query.branch_id),
  session_id: toInt(req.query.session_id),
  program_id: toInt(req.query.program_id),
  class_id: toInt(req.query.class_id),
  board_id: toInt(req.query.board_id),
  group_id: toInt(req.query.group_id),
  fee_section_id: toInt(req.query.fee_section_id),
  fee_structure_code: req.query.fee_structure_code
    ? String(req.query.fee_structure_code)
    : undefined,
  student_id: toInt(req.query.student_id),
  fee_term_id: toInt(req.query.fee_term_id),
  scope: req.query.scope as "class" | "group" | "student" | undefined,
});

// ── Lookups / Overview ────────────────────────────────────────────────────────
export const getLookups = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => lookupService.getFeeLookups(toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined), "Lookups loaded");

export const searchStudents = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lookupService.searchStudents({
        search: req.query.search ? String(req.query.search) : undefined,
        branch_id: toInt(req.query.branch_id),
        program_id: toInt(req.query.program_id),
        class_id: toInt(req.query.class_id),
        limit: toInt(req.query.limit, 30),
      }),
    "Students loaded"
  );

export const getOverview = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => lookupService.getModuleOverview(toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined), "Overview loaded");

// ── Fee Sections ──────────────────────────────────────────────────────────────
export const listSections = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => sectionService.listFeeSections(listParams(req)), "Fee sections fetched");

export const getSection = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => sectionService.getFeeSectionById(Number(req.params.id)), "Fee section fetched");

export const createSection = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => sectionService.createFeeSection(req.body, userId(req)), "Fee section created", 201);

export const updateSection = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => sectionService.updateFeeSection(Number(req.params.id), req.body, userId(req)), "Fee section updated");

export const toggleSection = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      sectionService.setFeeSectionStatus(
        Number(req.params.id),
        req.body.status === "0" || req.body.status === 0 ? "0" : "1",
        userId(req)
      ),
    "Fee section status updated"
  );

export const deleteSection = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => sectionService.deleteFeeSection(Number(req.params.id)), "Fee section deleted");

// ── Fee Section Prints ────────────────────────────────────────────────────────
export const listSectionPrints = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      sectionPrintService.listFeeSectionPrints({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    "Fee section prints fetched"
  );

export const getSectionPrint = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => sectionPrintService.getFeeSectionPrintById(Number(req.params.id)),
    "Fee section print fetched"
  );

export const createSectionPrint = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => sectionPrintService.createFeeSectionPrint(req.body, userId(req)),
    "Fee section print created",
    201
  );

export const updateSectionPrint = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => sectionPrintService.updateFeeSectionPrint(Number(req.params.id), req.body, userId(req)),
    "Fee section print updated"
  );

export const toggleSectionPrint = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      sectionPrintService.setFeeSectionPrintStatus(
        Number(req.params.id),
        req.body.status === "0" || req.body.status === 0 ? "0" : "1",
        userId(req)
      ),
    "Fee section print status updated"
  );

export const deleteSectionPrint = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => sectionPrintService.deleteFeeSectionPrint(Number(req.params.id)),
    "Fee section print deleted"
  );

// ── ERP Fee Heads ─────────────────────────────────────────────────────────────
export const listErpFeeHeads = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      erpFeeHeadService.listErpFeeHeads({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    "ERP fee heads fetched"
  );

export const getErpFeeHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => erpFeeHeadService.getErpFeeHeadById(Number(req.params.id)),
    "ERP fee head fetched"
  );

export const createErpFeeHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => erpFeeHeadService.createErpFeeHead(req.body, userId(req)),
    "ERP fee head created",
    201
  );

export const updateErpFeeHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => erpFeeHeadService.updateErpFeeHead(Number(req.params.id), req.body, userId(req)),
    "ERP fee head updated"
  );

export const toggleErpFeeHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      erpFeeHeadService.setErpFeeHeadStatus(
        Number(req.params.id),
        Number(req.body.status),
        userId(req)
      ),
    "ERP fee head status updated"
  );

export const deleteErpFeeHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => erpFeeHeadService.deleteErpFeeHead(Number(req.params.id)),
    "ERP fee head deleted"
  );

// ── Fee Heads (Types) ─────────────────────────────────────────────────────────
export const listHeads = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => headService.listFeeHeads(listParams(req)), "Fee types fetched");

export const getHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => headService.getFeeHeadById(Number(req.params.id)), "Fee type fetched");

export const createHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => headService.createFeeHead(req.body, userId(req)), "Fee type created", 201);

export const updateHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => headService.updateFeeHead(Number(req.params.id), req.body, userId(req)), "Fee type updated");

export const toggleHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      headService.setFeeHeadStatus(
        Number(req.params.id),
        Number(req.body.status) === 0 ? 0 : 1,
        userId(req)
      ),
    "Fee type status updated"
  );

export const deleteHead = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => headService.deleteFeeHead(Number(req.params.id)), "Fee type deleted");

// ── Fee Terms (Cycles) ────────────────────────────────────────────────────────
export const listTerms = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => termService.listFeeTerms(listParams(req)), "Fee cycles fetched");

export const getTerm = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => termService.getFeeTermById(Number(req.params.id)), "Fee cycle fetched");

export const createTerm = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => termService.createFeeTerm(req.body, userId(req)), "Fee cycle created", 201);

export const updateTerm = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => termService.updateFeeTerm(Number(req.params.id), req.body, userId(req)), "Fee cycle updated");

export const toggleTerm = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      termService.setFeeTermStatus(
        Number(req.params.id),
        String(req.body.status === 0 || req.body.status === "0" ? "0" : "1"),
        userId(req)
      ),
    "Fee cycle status updated"
  );

export const deleteTerm = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => termService.deleteFeeTerm(Number(req.params.id)), "Fee cycle deleted");

// ── Installments ──────────────────────────────────────────────────────────────
export const listInstallments = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => installmentService.listInstallments(listParams(req)), "Installments fetched");

export const getInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => installmentService.getInstallmentById(Number(req.params.id)), "Installment fetched");

export const createInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => installmentService.createInstallment(req.body, userId(req)), "Installment created", 201);

export const updateInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => installmentService.updateInstallment(Number(req.params.id), req.body, userId(req)), "Installment updated");

export const toggleInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      installmentService.setInstallmentStatus(
        Number(req.params.id),
        String(req.body.status === 0 || req.body.status === "0" ? "0" : "1"),
        userId(req)
      ),
    "Installment status updated"
  );

export const deleteInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => installmentService.deleteInstallment(Number(req.params.id)), "Installment deleted");

export const excludeStudentFromInstallment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => installmentService.excludeStudentFromInstallment(req.body, userId(req)),
    "Student excluded from installment",
    201
  );

export const removeInstallmentExclusion = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => installmentService.removeInstallmentExclusion(req.body),
    "Installment exclusion removed"
  );

export const checkInstallmentExclusion = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      installmentService.isStudentExcludedFromInstallment(
        Number(req.query.student_id),
        Number(req.query.installment_id)
      ),
    "Exclusion status checked"
  );

// ── Fee Structures ────────────────────────────────────────────────────────────
export const listStructures = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.listFeeStructures(listParams(req)), "Fee structures fetched");

export const listStructureGroups = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.listStructureGroups(listParams(req)), "Fee structure groups fetched");

export const getStructure = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.getFeeStructureById(Number(req.params.id)), "Fee structure line fetched");

export const createStructure = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.createFeeStructure(req.body, userId(req)), "Fee structure line created", 201);

export const createStructureBulk = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.createFeeStructureBulk(req.body, userId(req)), "Fee structure created", 201);

export const updateStructure = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.updateFeeStructure(Number(req.params.id), req.body, userId(req)), "Fee structure updated");

export const toggleStructure = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      structureService.setFeeStructureStatus(
        Number(req.params.id),
        Number(req.body.status) === 0 ? 0 : 1,
        userId(req)
      ),
    "Fee structure status updated"
  );

export const toggleStructureGroup = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      structureService.setStructureGroupStatus(
        String(req.params.code),
        Number(req.body.status) === 0 ? 0 : 1,
        userId(req)
      ),
    "Fee structure group status updated"
  );

export const deleteStructure = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => structureService.deleteFeeStructure(Number(req.params.id)), "Fee structure line deleted");

// ── Assignments ───────────────────────────────────────────────────────────────
export const listAssignments = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => assignmentService.listAssignments(listParams(req)), "Assignments fetched");

export const getAssignment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => assignmentService.getAssignmentById(Number(req.params.id)), "Assignment fetched");

export const createAssignment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => assignmentService.createAssignment(req.body, userId(req)), "Fee structure assigned", 201);

export const updateAssignment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => assignmentService.updateAssignment(Number(req.params.id), req.body, userId(req)), "Assignment updated");

export const toggleAssignment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      assignmentService.setAssignmentStatus(
        Number(req.params.id),
        String(req.body.status === 0 || req.body.status === "0" ? "0" : "1"),
        userId(req)
      ),
    "Assignment status updated"
  );

export const deleteAssignment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => assignmentService.deleteAssignment(Number(req.params.id)), "Assignment deleted");

// ── Module 2: Student Fee Records ─────────────────────────────────────────────
export const listStudentFeeRecords = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      studentFeeService.listStudentFeeRecords({
        page: toInt(req.query.page, 1),
        limit: toInt(req.query.limit, 20),
        search: req.query.search ? String(req.query.search) : undefined,
        branch_id: toInt(req.query.branch_id),
        program_id: toInt(req.query.program_id),
        class_id: toInt(req.query.class_id),
        status: req.query.status ? String(req.query.status) : undefined,
      }),
    "Student fee records fetched"
  );

export const getStudentFeeDashboard = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.getStudentFeeDashboard(Number(req.params.studentId)),
    "Student fee dashboard loaded"
  );

export const getStudentInvoice = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.getInvoiceView(Number(req.params.basicId)),
    "Invoice loaded"
  );

export const getStudentReceipt = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.getReceiptView(Number(req.params.basicId)),
    "Receipt loaded"
  );

export const recordStudentPayment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.recordPayment(req.body, userId(req)),
    "Payment recorded"
  );

export const upsertStudentFeeSettings = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.upsertStudentFeeSettings(req.body),
    "Student fee settings saved"
  );

export const upsertFeeAutomate = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => studentFeeService.upsertFeeAutomate(req.body),
    "Fee automate profile saved"
  );

export const listDiscountTypes = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => studentFeeService.listDiscountTypes(), "Discount types fetched");

// ── Module 3: Payment Processing ──────────────────────────────────────────────
export const getPaymentWorkspace = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => paymentService.getPaymentWorkspace(Number(req.params.studentId)),
    "Payment workspace loaded"
  );

export const listPaymentMethods = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => paymentService.listPaymentMethods(), "Payment methods fetched");

export const listPaymentSettings = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => paymentService.listPaymentSettings(), "Payment settings fetched");

export const processFeePayment = (req: AuthRequest, res: Response, next: NextFunction) => {
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  const receiptPath = file
    ? `/uploads/fee-receipts/${file.filename}`
    : null;
  handle(
    res,
    next,
    () =>
      paymentService.processPayment(
        { ...req.body, receipt_image_path: receiptPath },
        userId(req)
      ),
    "Payment processed successfully"
  );
};

export const initiateOnlinePayment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => paymentService.initiateOnlinePayment(req.body, userId(req)),
    "Sandbox checkout session created",
    201
  );

export const completeOnlinePayment = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => paymentService.completeOnlinePayment(req.body, userId(req)),
    "Online payment finalized"
  );

export const listStudentPaymentHistory = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => paymentService.listStudentPaymentHistory(Number(req.params.studentId)),
    "Payment history fetched"
  );

// ── Module 4: Discounts & Concessions ─────────────────────────────────────────
export const listDiscountTypesAdmin = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.listDiscountTypesAdmin({
        search: req.query.search ? String(req.query.search) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      }),
    "Discount types fetched"
  );

export const createDiscountType = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.createDiscountType(req.body, userId(req)),
    "Discount type created",
    201
  );

export const updateDiscountType = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.updateDiscountType(Number(req.params.id), req.body, userId(req)),
    "Discount type updated"
  );

export const setDiscountTypeStatus = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.setDiscountTypeStatus(
        Number(req.params.id),
        req.body.status,
        userId(req)
      ),
    "Discount type status updated"
  );

export const listScholarshipCatalog = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.listScholarshipCatalog({
        branch_id: toInt(req.query.branch_id),
        session_id: toInt(req.query.session_id),
        program_id: toInt(req.query.program_id),
        status: req.query.status ? String(req.query.status) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      }),
    "Scholarship definitions fetched"
  );

export const getScholarshipCatalog = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.getScholarshipCatalogById(Number(req.params.id)),
    "Scholarship definition fetched"
  );

export const createScholarshipCatalog = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.createScholarshipCatalog(req.body, userId(req)),
    "Scholarship definition created",
    201
  );

export const updateScholarshipCatalog = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.updateScholarshipCatalog(
        Number(req.params.id),
        req.body,
        userId(req)
      ),
    "Scholarship definition updated"
  );

export const setScholarshipCatalogStatus = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) =>
  handle(
    res,
    next,
    () =>
      discountService.setScholarshipCatalogStatus(
        Number(req.params.id),
        req.body.status,
        userId(req)
      ),
    "Scholarship definition status updated"
  );

export const listScholarshipRules = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.listScholarshipRules({
        branch_id: toInt(req.query.branch_id),
        session_id: toInt(req.query.session_id),
        program_id: toInt(req.query.program_id),
        class_id: toInt(req.query.class_id),
        status: toInt(req.query.status),
        search: req.query.search ? String(req.query.search) : undefined,
      }),
    "Scholarship rules fetched"
  );

export const createScholarshipRule = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.createScholarshipRule(req.body, userId(req)),
    "Scholarship rule created",
    201
  );

export const updateScholarshipRule = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      discountService.updateScholarshipRule(
        Number(req.params.id),
        req.body,
        userId(req)
      ),
    "Scholarship rule updated"
  );

export const listScholarshipSettings = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.listScholarshipSettings(),
    "Scholarship settings fetched"
  );

export const upsertScholarshipSettings = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) =>
  handle(
    res,
    next,
    () => discountService.upsertScholarshipSettings(req.body, userId(req)),
    "Scholarship settings saved"
  );

export const getDiscountWorkspace = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.getDiscountWorkspace(Number(req.params.studentId)),
    "Discount workspace loaded"
  );

export const applyStudentDiscount = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.applyDiscount(req.body, userId(req)),
    "Discount applied successfully"
  );

export const applyStudentScholarship = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) =>
  handle(
    res,
    next,
    () => discountService.applyScholarship(req.body, userId(req)),
    "Scholarship applied successfully"
  );

export const applyStudentConcession = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.applyConcession(req.body, userId(req)),
    "Concession applied successfully"
  );

export const applyStudentNoDiscount = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => discountService.applyNoDiscountFullFee(req.body, userId(req)),
    "No discount applied; full fee restored"
  );

// ── Module 5 — Late Fee Management ───────────────────────────────────────────
export const getLateFeeWorkspace = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lateFeeService.getLateFeeWorkspace(
        toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined
      ),
    "Late fee workspace loaded"
  );

export const listLateFeeRules = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lateFeeService.listLateFeeRules({
        branch_id: toInt(req.query.branch_id),
        status: req.query.status ? String(req.query.status) : undefined,
      }),
    "Late fee rules fetched"
  );

export const createLateFeeRule = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => lateFeeService.createLateFeeRule(req.body),
    "Late fee rule created",
    201
  );

export const updateLateFeeRule = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => lateFeeService.updateLateFeeRule(Number(req.params.id), req.body),
    "Late fee rule updated"
  );

export const setLateFeeRuleStatus = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lateFeeService.setLateFeeRuleStatus(
        Number(req.params.id),
        req.body.status === "Inactive" ? "Inactive" : "Active"
      ),
    "Late fee rule status updated"
  );

export const deleteLateFeeRule = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => lateFeeService.deleteLateFeeRule(Number(req.params.id)),
    "Late fee rule deleted"
  );

export const listLateFeeIncidents = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lateFeeService.listLateFeeIncidents({
        branch_id: toInt(req.query.branch_id),
        program_id: toInt(req.query.program_id),
        class_id: toInt(req.query.class_id),
        search: req.query.search ? String(req.query.search) : undefined,
        page: toInt(req.query.page, 1),
        limit: toInt(req.query.limit, 20),
      }),
    "Late fee incidents fetched"
  );

export const previewLateFee = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      lateFeeService.previewLateFee(
        String(req.params.basicId ?? ""),
        req.query.as_of_date ? String(req.query.as_of_date) : undefined
      ),
    "Late fee preview calculated"
  );

// ── Module 6 — Alerts & Notifications ────────────────────────────────────────
export const getNotificationWorkspace = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      notificationService.getNotificationWorkspace(
        toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined
      ),
    "Notification workspace loaded"
  );

export const getNotificationSettings = (_req: AuthRequest, res: Response, next: NextFunction) =>
  handle(res, next, () => notificationService.getNotificationSettings(), "Notification settings loaded");

export const updateNotificationSettings = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => notificationService.updateNotificationSettings(req.body),
    "Notification settings updated"
  );

export const listNotificationLog = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      notificationService.listNotificationLog({
        page: toInt(req.query.page, 1),
        limit: toInt(req.query.limit, 20),
        type: req.query.type ? (String(req.query.type) as never) : undefined,
        status: req.query.status ? (String(req.query.status) as never) : undefined,
      }),
    "Notification log fetched"
  );

export const previewNotificationCandidates = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      notificationService.previewNotificationCandidatesPublic(
        toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined
      ),
    "Notification candidates previewed"
  );

export const runDueDateReminders = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      notificationService.runDueDateReminders({
        branch_id: req.body.branch_id ?? req.user?.branch_id ?? undefined,
        dry_run: req.body.dry_run,
      }),
    "Due date reminders processed"
  );

export const runOverdueNotifications = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      notificationService.runOverdueNotifications({
        branch_id: req.body.branch_id ?? req.user?.branch_id ?? undefined,
        dry_run: req.body.dry_run,
      }),
    "Overdue notifications processed"
  );

// ── Module 7 — Reporting & Analytics ─────────────────────────────────────────
const reportFilters = (req: FeeAuthRequest) => {
  const filters = {
    date_from: req.query.date_from ? String(req.query.date_from) : undefined,
    date_to: req.query.date_to ? String(req.query.date_to) : undefined,
    branch_id: toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined,
    session_id: toInt(req.query.session_id),
    program_id: toInt(req.query.program_id),
    class_id: toInt(req.query.class_id),
    class_ids: undefined as number[] | undefined,
    student_id: toInt(req.query.student_id),
    payment_mode: req.query.payment_mode ? String(req.query.payment_mode) : undefined,
    fee_status: req.query.fee_status ? String(req.query.fee_status) : undefined,
    due_status: req.query.due_status
      ? (String(req.query.due_status) as
          | "all"
          | "outstanding"
          | "overdue"
          | "paid"
          | "partial")
      : undefined,
    page: toInt(req.query.page, 1),
    limit: toInt(req.query.limit, 50),
    sort: req.query.sort ? String(req.query.sort) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    group_by: req.query.group_by
      ? (String(req.query.group_by) as "day" | "month" | "year")
      : undefined,
  };

  // Teachers: force class scope when assigned class ids are known
  if (req.feeActor?.feeRole === "teacher" && req.feeActor.teacherClassIds.length) {
    filters.class_ids = req.feeActor.teacherClassIds;
  }
  return filters;
};

export const getReportingWorkspace = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getReportingWorkspace(reportFilters(req)),
    "Reporting workspace loaded"
  );

export const getReportingAnalytics = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getReportingAnalytics(reportFilters(req)),
    "Reporting analytics loaded"
  );

export const getCollectionReport = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getCollectionReport(reportFilters(req)),
    "Collection report loaded"
  );

export const getOutstandingDuesReport = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getOutstandingDuesReport(reportFilters(req)),
    "Outstanding dues report loaded"
  );

export const getDiscountReport = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getDiscountReport(reportFilters(req)),
    "Discount report loaded"
  );

export const getDefaultersReport = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => reportingService.getDefaultersReport(reportFilters(req)),
    "Defaulters report loaded"
  );

export const getFeeAuditTrail = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      listFeeAuditTrail({
        page: toInt(req.query.page, 1),
        limit: toInt(req.query.limit, 20),
        action: req.query.action ? String(req.query.action) : undefined,
        record_type: req.query.record_type ? String(req.query.record_type) : undefined,
        user_id: toInt(req.query.user_id),
        branch_id: toInt(req.query.branch_id) ?? req.user?.branch_id ?? undefined,
        date_from: req.query.date_from ? String(req.query.date_from) : undefined,
        date_to: req.query.date_to ? String(req.query.date_to) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      }),
    "Fee audit trail loaded"
  );

// ── Module 8 — Security & Access Control ─────────────────────────────────────
export const getFeeAccessProfile = (req: AuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => loadFeeAccessProfile(req.user),
    "Fee access profile loaded"
  );

export const getMyFeeDashboard = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      selfService.getMyFeeDashboard(
        req.feeActor!,
        toInt(req.query.student_id) ?? undefined
      ),
    "Your fee dashboard loaded"
  );

export const getMyPaymentWorkspace = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      selfService.getMyPaymentWorkspace(
        req.feeActor!,
        toInt(req.query.student_id) ?? undefined
      ),
    "Your payment workspace loaded"
  );

export const getMyPaymentHistory = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () =>
      selfService.getMyPaymentHistory(
        req.feeActor!,
        toInt(req.query.student_id) ?? undefined
      ),
    "Your payment history loaded"
  );

export const getMyInvoice = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => selfService.getMyInvoice(req.feeActor!, Number(req.params.basicId)),
    "Your invoice loaded"
  );

export const getMyReceipt = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => selfService.getMyReceipt(req.feeActor!, Number(req.params.basicId)),
    "Your receipt loaded"
  );

export const payMyFees = (req: FeeAuthRequest, res: Response, next: NextFunction) =>
  handle(
    res,
    next,
    () => selfService.payMyFees(req.feeActor!, req.body, userId(req)),
    "Your payment recorded",
    201
  );
