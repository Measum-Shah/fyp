import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validateBody } from "../utils/fee.helpers";
import {
  feeSectionCreateSchema,
  feeSectionUpdateSchema,
  feeSectionPrintCreateSchema,
  feeSectionPrintUpdateSchema,
  erpFeeHeadCreateSchema,
  erpFeeHeadUpdateSchema,
  feeHeadCreateSchema,
  feeHeadUpdateSchema,
  feeTermCreateSchema,
  feeTermUpdateSchema,
  installmentCreateSchema,
  installmentUpdateSchema,
  feeStructureCreateSchema,
  feeStructureBulkCreateSchema,
  feeStructureUpdateSchema,
  assignmentCreateSchema,
  assignmentUpdateSchema,
} from "../validators/fee.validators";
import {
  studentFeeSettingsUpsertSchema,
  feeAutomateUpsertSchema,
  recordPaymentSchema,
} from "../validators/studentFeeRecord.validators";
import {
  processPaymentSchema,
  initiateOnlinePaymentSchema,
  completeOnlinePaymentSchema,
} from "../validators/payment.validators";
import {
  discountTypeCreateSchema,
  discountTypeUpdateSchema,
  scholarshipCatalogCreateSchema,
  scholarshipCatalogUpdateSchema,
  scholarshipRuleCreateSchema,
  scholarshipRuleUpdateSchema,
  scholarshipSettingsUpsertSchema,
  applyDiscountSchema,
  applyScholarshipSchema,
  applyConcessionSchema,
  applyNoDiscountSchema,
} from "../validators/discountConcession.validators";
import {
  lateFeeRuleCreateSchema,
  lateFeeRuleUpdateSchema,
} from "../validators/lateFee.validators";
import {
  notificationSettingsUpdateSchema,
  runNotificationsSchema,
} from "../validators/feeNotification.validators";
import * as ctrl from "../controllers/fee.controller";
import { feeReceiptUpload } from "../middlewares/feeUpload.middleware";
import { AppError } from "../utils/fee.helpers";
import { feeAuditMiddleware } from "../middlewares/feeAudit.middleware";
import {
  attachFeeActor,
  requireFeeCapability,
  requireScopedStudent,
} from "../middlewares/feeAccess.middleware";
import { FEE_CAPABILITIES } from "../constants/feeAccess.constants";
import { z } from "zod";

const router = Router();

const canSetup = requireFeeCapability(FEE_CAPABILITIES.MANAGE_FEE_SETUP);
const canAssign = requireFeeCapability(FEE_CAPABILITIES.MANAGE_ASSIGNMENTS);
const canViewRecords = requireFeeCapability(FEE_CAPABILITIES.VIEW_STUDENT_RECORDS);
const canPay = requireFeeCapability(FEE_CAPABILITIES.PROCESS_PAYMENTS);
const canDiscount = requireFeeCapability(FEE_CAPABILITIES.MANAGE_DISCOUNTS);
const canLateFee = requireFeeCapability(FEE_CAPABILITIES.MANAGE_LATE_FEES);
const canNotify = requireFeeCapability(FEE_CAPABILITIES.MANAGE_NOTIFICATIONS);
const canReports = requireFeeCapability(FEE_CAPABILITIES.VIEW_REPORTS);
const canDefaulters = requireFeeCapability(FEE_CAPABILITIES.VIEW_DEFAULTERS);
const canAudit = requireFeeCapability(FEE_CAPABILITIES.VIEW_AUDIT);
const canAdminDash = requireFeeCapability(FEE_CAPABILITIES.VIEW_ADMIN_DASHBOARD);
const canOwnFees = requireFeeCapability(FEE_CAPABILITIES.VIEW_OWN_FEES);
const canPayOwn = requireFeeCapability(FEE_CAPABILITIES.PAY_OWN_FEES);

router.use(authMiddleware);
router.use(feeAuditMiddleware);
router.use(attachFeeActor);

const errorBoundary = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error("Fee module error:", err);
  return res.status(500).json({ message: "Internal server error" });
};

// Module 8 — Access profile (any authenticated fee user)
router.get("/access", ctrl.getFeeAccessProfile);

// Module 8 — Parent/Student self-service (own data only)
router.get("/me/dashboard", canOwnFees, ctrl.getMyFeeDashboard);
router.get("/me/payments/workspace", canOwnFees, ctrl.getMyPaymentWorkspace);
router.get("/me/payments/history", canOwnFees, ctrl.getMyPaymentHistory);
router.get("/me/invoices/:basicId", canOwnFees, ctrl.getMyInvoice);
router.get("/me/receipts/:basicId", canOwnFees, ctrl.getMyReceipt);
router.post(
  "/me/payments/process",
  canPayOwn,
  validateBody(processPaymentSchema),
  ctrl.payMyFees
);

// Lookups / overview — admin console
router.get("/lookups", canAdminDash, ctrl.getLookups);
router.get("/students/search", canViewRecords, ctrl.searchStudents);
router.get("/overview", canAdminDash, ctrl.getOverview);

// Fee Sections
router.get("/sections", canSetup, ctrl.listSections);
router.get("/sections/:id", canSetup, ctrl.getSection);
router.post("/sections", canSetup, validateBody(feeSectionCreateSchema), ctrl.createSection);
router.put("/sections/:id", canSetup, validateBody(feeSectionUpdateSchema), ctrl.updateSection);
router.patch("/sections/:id/status", canSetup, ctrl.toggleSection);
router.delete("/sections/:id", canSetup, ctrl.deleteSection);

// Fee Section Prints
router.get("/section-prints", canSetup, ctrl.listSectionPrints);
router.get("/section-prints/:id", canSetup, ctrl.getSectionPrint);
router.post("/section-prints", canSetup, validateBody(feeSectionPrintCreateSchema), ctrl.createSectionPrint);
router.put("/section-prints/:id", canSetup, validateBody(feeSectionPrintUpdateSchema), ctrl.updateSectionPrint);
router.patch("/section-prints/:id/status", canSetup, ctrl.toggleSectionPrint);
router.delete("/section-prints/:id", canSetup, ctrl.deleteSectionPrint);

// ERP Fee Heads (parent categories for Fee Types)
router.get("/erp-fee-heads", canSetup, ctrl.listErpFeeHeads);
router.get("/erp-fee-heads/:id", canSetup, ctrl.getErpFeeHead);
router.post("/erp-fee-heads", canSetup, validateBody(erpFeeHeadCreateSchema), ctrl.createErpFeeHead);
router.put("/erp-fee-heads/:id", canSetup, validateBody(erpFeeHeadUpdateSchema), ctrl.updateErpFeeHead);
router.patch("/erp-fee-heads/:id/status", canSetup, ctrl.toggleErpFeeHead);
router.delete("/erp-fee-heads/:id", canSetup, ctrl.deleteErpFeeHead);

// Fee Types (Heads)
router.get("/heads", canSetup, ctrl.listHeads);
router.get("/heads/:id", canSetup, ctrl.getHead);
router.post("/heads", canSetup, validateBody(feeHeadCreateSchema), ctrl.createHead);
router.put("/heads/:id", canSetup, validateBody(feeHeadUpdateSchema), ctrl.updateHead);
router.patch("/heads/:id/status", canSetup, ctrl.toggleHead);
router.delete("/heads/:id", canSetup, ctrl.deleteHead);

// Fee Cycles (Terms)
router.get("/terms", canSetup, ctrl.listTerms);
router.get("/terms/:id", canSetup, ctrl.getTerm);
router.post("/terms", canSetup, validateBody(feeTermCreateSchema), ctrl.createTerm);
router.put("/terms/:id", canSetup, validateBody(feeTermUpdateSchema), ctrl.updateTerm);
router.patch("/terms/:id/status", canSetup, ctrl.toggleTerm);
router.delete("/terms/:id", canSetup, ctrl.deleteTerm);

// Installment Plans
router.get("/installments", canSetup, ctrl.listInstallments);
router.get("/installments/:id", canSetup, ctrl.getInstallment);
router.post("/installments", canSetup, validateBody(installmentCreateSchema), ctrl.createInstallment);
router.put("/installments/:id", canSetup, validateBody(installmentUpdateSchema), ctrl.updateInstallment);
router.patch("/installments/:id/status", canSetup, ctrl.toggleInstallment);
router.delete("/installments/:id", canSetup, ctrl.deleteInstallment);
router.post("/installments/exclude", canSetup, ctrl.excludeStudentFromInstallment);
router.post("/installments/remove-exclusion", canSetup, ctrl.removeInstallmentExclusion);
router.get("/installments/check-exclusion", canSetup, ctrl.checkInstallmentExclusion);

// Fee Structures
router.get("/structures", canSetup, ctrl.listStructures);
router.get("/structures/groups", canSetup, ctrl.listStructureGroups);
router.get("/structures/:id", canSetup, ctrl.getStructure);
router.post("/structures", canSetup, validateBody(feeStructureCreateSchema), ctrl.createStructure);
router.post("/structures/bulk", canSetup, validateBody(feeStructureBulkCreateSchema), ctrl.createStructureBulk);
router.put("/structures/:id", canSetup, validateBody(feeStructureUpdateSchema), ctrl.updateStructure);
router.patch("/structures/:id/status", canSetup, ctrl.toggleStructure);
router.patch("/structures/groups/:code/status", canSetup, ctrl.toggleStructureGroup);
router.delete("/structures/:id", canSetup, ctrl.deleteStructure);

// Assignments
router.get("/assignments", canAssign, ctrl.listAssignments);
router.get("/assignments/:id", canAssign, ctrl.getAssignment);
router.post("/assignments", canAssign, validateBody(assignmentCreateSchema), ctrl.createAssignment);
router.put("/assignments/:id", canAssign, validateBody(assignmentUpdateSchema), ctrl.updateAssignment);
router.patch("/assignments/:id/status", canAssign, ctrl.toggleAssignment);
router.delete("/assignments/:id", canAssign, ctrl.deleteAssignment);

// Module 2 — Student Fee Records
router.get("/student-records", canViewRecords, ctrl.listStudentFeeRecords);
router.get("/student-records/invoices/:basicId", canViewRecords, ctrl.getStudentInvoice);
router.get("/student-records/receipts/:basicId", canViewRecords, ctrl.getStudentReceipt);
router.get(
  "/student-records/:studentId/dashboard",
  canViewRecords,
  requireScopedStudent,
  ctrl.getStudentFeeDashboard
);
router.post(
  "/student-records/payments",
  canPay,
  validateBody(recordPaymentSchema),
  ctrl.recordStudentPayment
);
router.post(
  "/student-records/settings",
  canViewRecords,
  validateBody(studentFeeSettingsUpsertSchema),
  ctrl.upsertStudentFeeSettings
);
router.post(
  "/student-records/automate",
  canViewRecords,
  validateBody(feeAutomateUpsertSchema),
  ctrl.upsertFeeAutomate
);
router.get("/discount-types", canViewRecords, ctrl.listDiscountTypes);

// Module 3 — Payment Processing
router.get("/payments/methods", canPay, ctrl.listPaymentMethods);
router.get("/payments/settings", canPay, ctrl.listPaymentSettings);
router.get(
  "/payments/workspace/:studentId",
  canPay,
  requireScopedStudent,
  ctrl.getPaymentWorkspace
);
router.get(
  "/payments/history/:studentId",
  canPay,
  requireScopedStudent,
  ctrl.listStudentPaymentHistory
);
router.post(
  "/payments/process",
  canPay,
  feeReceiptUpload.single("receipt_image"),
  validateBody(processPaymentSchema),
  ctrl.processFeePayment
);
router.post(
  "/payments/online/initiate",
  canPay,
  validateBody(initiateOnlinePaymentSchema),
  ctrl.initiateOnlinePayment
);
router.post(
  "/payments/online/complete",
  canPay,
  validateBody(completeOnlinePaymentSchema),
  ctrl.completeOnlinePayment
);

// Module 4 — Discounts & Concessions
router.get("/discounts/types", canDiscount, ctrl.listDiscountTypesAdmin);
router.post(
  "/discounts/types",
  canDiscount,
  validateBody(discountTypeCreateSchema),
  ctrl.createDiscountType
);
router.put(
  "/discounts/types/:id",
  canDiscount,
  validateBody(discountTypeUpdateSchema),
  ctrl.updateDiscountType
);
router.patch(
  "/discounts/types/:id/status",
  canDiscount,
  validateBody(z.object({ status: z.enum(["Active", "Inactive"]) })),
  ctrl.setDiscountTypeStatus
);

router.get("/discounts/scholarships", canDiscount, ctrl.listScholarshipCatalog);
router.get("/discounts/scholarships/:id", canDiscount, ctrl.getScholarshipCatalog);
router.post(
  "/discounts/scholarships",
  canDiscount,
  validateBody(scholarshipCatalogCreateSchema),
  ctrl.createScholarshipCatalog
);
router.put(
  "/discounts/scholarships/:id",
  canDiscount,
  validateBody(scholarshipCatalogUpdateSchema),
  ctrl.updateScholarshipCatalog
);
router.patch(
  "/discounts/scholarships/:id/status",
  canDiscount,
  validateBody(z.object({ status: z.enum(["1", "0"]) })),
  ctrl.setScholarshipCatalogStatus
);

router.get("/discounts/rules", canDiscount, ctrl.listScholarshipRules);
router.post(
  "/discounts/rules",
  canDiscount,
  validateBody(scholarshipRuleCreateSchema),
  ctrl.createScholarshipRule
);
router.put(
  "/discounts/rules/:id",
  canDiscount,
  validateBody(scholarshipRuleUpdateSchema),
  ctrl.updateScholarshipRule
);

router.get("/discounts/settings", canDiscount, ctrl.listScholarshipSettings);
router.post(
  "/discounts/settings",
  canDiscount,
  validateBody(scholarshipSettingsUpsertSchema),
  ctrl.upsertScholarshipSettings
);

router.get(
  "/discounts/workspace/:studentId",
  canDiscount,
  requireScopedStudent,
  ctrl.getDiscountWorkspace
);
router.post(
  "/discounts/apply-discount",
  canDiscount,
  validateBody(applyDiscountSchema),
  ctrl.applyStudentDiscount
);
router.post(
  "/discounts/apply-scholarship",
  canDiscount,
  validateBody(applyScholarshipSchema),
  ctrl.applyStudentScholarship
);
router.post(
  "/discounts/apply-concession",
  canDiscount,
  validateBody(applyConcessionSchema),
  ctrl.applyStudentConcession
);
router.post(
  "/discounts/apply-no-discount",
  canDiscount,
  validateBody(applyNoDiscountSchema),
  ctrl.applyStudentNoDiscount
);

// Module 5 — Late Fee Management
router.get("/late-fees/workspace", canLateFee, ctrl.getLateFeeWorkspace);
router.get("/late-fees/rules", canLateFee, ctrl.listLateFeeRules);
router.post("/late-fees/rules", canLateFee, validateBody(lateFeeRuleCreateSchema), ctrl.createLateFeeRule);
router.put(
  "/late-fees/rules/:id",
  canLateFee,
  validateBody(lateFeeRuleUpdateSchema),
  ctrl.updateLateFeeRule
);
router.patch("/late-fees/rules/:id/status", canLateFee, ctrl.setLateFeeRuleStatus);
router.delete("/late-fees/rules/:id", canLateFee, ctrl.deleteLateFeeRule);
router.get("/late-fees/incidents", canLateFee, ctrl.listLateFeeIncidents);
router.get("/late-fees/preview/:basicId", canLateFee, ctrl.previewLateFee);

// Module 6 — Alerts & Notifications
router.get("/notifications/workspace", canNotify, ctrl.getNotificationWorkspace);
router.get("/notifications/settings", canNotify, ctrl.getNotificationSettings);
router.put(
  "/notifications/settings",
  canNotify,
  validateBody(notificationSettingsUpdateSchema),
  ctrl.updateNotificationSettings
);
router.get("/notifications/log", canNotify, ctrl.listNotificationLog);
router.get("/notifications/candidates", canNotify, ctrl.previewNotificationCandidates);
router.post(
  "/notifications/run-due-reminders",
  canNotify,
  validateBody(runNotificationsSchema),
  ctrl.runDueDateReminders
);
router.post(
  "/notifications/run-overdue",
  canNotify,
  validateBody(runNotificationsSchema),
  ctrl.runOverdueNotifications
);

// Module 7 — Reporting & Analytics
router.get("/reports/workspace", canReports, ctrl.getReportingWorkspace);
router.get("/reports/analytics", canReports, ctrl.getReportingAnalytics);
router.get("/reports/collections", canReports, ctrl.getCollectionReport);
router.get("/reports/outstanding", canDefaulters, ctrl.getOutstandingDuesReport);
router.get("/reports/discounts", canReports, ctrl.getDiscountReport);
router.get("/reports/defaulters", canDefaulters, ctrl.getDefaultersReport);
router.get("/reports/audit-trail", canAudit, ctrl.getFeeAuditTrail);

router.use(errorBoundary);

export default router;
