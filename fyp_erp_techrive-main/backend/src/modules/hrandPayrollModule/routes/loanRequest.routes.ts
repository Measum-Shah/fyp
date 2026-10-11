import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { createUploader } from "../middlewares/upload.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import { LOAN_REQUEST_ATTACHMENT_UPLOAD_SUBDIR } from "../constants/loanRequest.constants";
import {
  changeLoanRequestStatus,
  createLoanRequest,
  deleteLoanRequest,
  getEmployeeLookup,
  getLoanRequestById,
  getLoanRequests,
  updateLoanRequest,
  uploadLoanRequestAttachment,
} from "../controllers/loanRequest.controller";
import { getLoanRequestById as fetchLoanRequestById } from "../services/loanRequest.service";
import {
  changeLoanRequestStatusSchema,
  createLoanRequestSchema,
  loanRequestIdParamSchema,
  listLoanRequestsQuerySchema,
  updateLoanRequestSchema,
} from "../validators/loanRequest.validator";

const router = Router();

// All Loan Request routes require an authenticated ERP user
router.use(authMiddleware);

const loanRequestUpload = createUploader(LOAN_REQUEST_ATTACHMENT_UPLOAD_SUBDIR);

// GET /api/loan-requests
router.get(
  "/",
  requireHrAccess("loan_request.view"), validate(listLoanRequestsQuerySchema, "query"), getLoanRequests);

// ─── Lookup for the New Loan Request form's Employee dropdown ──────────────
// MUST be registered before "/:id" — same reasoning as employee.routes.ts.
router.get("/lookups/employees", requireHrAccess("directory.read"), getEmployeeLookup);

// POST /api/loan-requests/upload-attachment (multipart, field name "file")
// MUST be registered before "/:id" — literal path wins the match.
router.post(
  "/upload-attachment",
  requireHrAccess("loan_request.create"),
  (req, res, next) => {
    loanRequestUpload.single("file")(req, res, (err) => {
      if (!err) return next();
      const status = (err as { statusCode?: number; code?: string }).statusCode || 400;
      const message =
        (err as { code?: string }).code === "LIMIT_FILE_SIZE"
          ? "Attachment must be 5 MB or smaller."
          : (err as Error).message || "Invalid attachment upload.";
      return res.status(status).json({ success: false, message });
    });
  },
  uploadLoanRequestAttachment
);

// GET /api/loan-requests/:id
router.get(
  "/:id",
  requireHrAccess("loan_request.view"), validate(loanRequestIdParamSchema, "params"), getLoanRequestById);

// POST /api/loan-requests
router.post(
  "/",
  requireHrAccess("loan_request.create"), validate(createLoanRequestSchema, "body"), createLoanRequest);

// PUT /api/loan-requests/:id
router.put(
  "/:id",
  requireHrAccess("loan_request.update"),
  validate(loanRequestIdParamSchema, "params"),
  validate(updateLoanRequestSchema, "body"),
  updateLoanRequest
);

// PATCH /api/loan-requests/:id/status — Approve/Reject/back to Pending
// `status` is a fixed enum here (see loanRequest.constants.ts), unlike
// leave_status which is a free-standing FK — so the audit log's action can
// be pre-labelled from the submitted value below.
router.patch(
  "/:id/status",
  requireHrAccess("loan_request.approve"),
  validate(loanRequestIdParamSchema, "params"),
  validate(changeLoanRequestStatusSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.LOAN,
    action: ACTIVITY_ACTION.STATUS_CHANGED,
    loadPrevious: (req) => fetchLoanRequestById(Number(req.params.id)),
  }),
  changeLoanRequestStatus
);

// DELETE /api/loan-requests/:id
router.delete(
  "/:id",
  requireHrAccess("loan_request.delete"), validate(loanRequestIdParamSchema, "params"), deleteLoanRequest);

export default router;