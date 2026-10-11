import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  changeLeaveRequestStatus,
  createLeaveRequest,
  deleteLeaveRequest,
  getEmployeeLookup,
  getLeaveRequestById,
  getLeaveRequests,
  updateLeaveRequest,
} from "../controllers/leaveRequest.controller";
import { getLeaveRequestById as fetchLeaveRequestById } from "../services/leaveRequest.service";
import {
  changeLeaveRequestStatusSchema,
  createLeaveRequestSchema,
  leaveRequestIdParamSchema,
  listLeaveRequestsQuerySchema,
  updateLeaveRequestSchema,
} from "../validators/leaveRequest.validator";

const router = Router();

// All Leave Request routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/leave-requests
router.get(
  "/",
  requireHrAccess("leave_request.view"), validate(listLeaveRequestsQuerySchema, "query"), getLeaveRequests);

// ─── Lookup for the Apply Leave form's Employee dropdown ───────────────────
// MUST be registered before "/:id" — same reasoning as employee.routes.ts.
router.get("/lookups/employees", requireHrAccess("directory.read"), getEmployeeLookup);

// GET /api/leave-requests/:id
router.get(
  "/:id",
  requireHrAccess("leave_request.view"), validate(leaveRequestIdParamSchema, "params"), getLeaveRequestById);

// POST /api/leave-requests
router.post(
  "/",
  requireHrAccess("leave_request.create"), validate(createLeaveRequestSchema, "body"), createLeaveRequest);

// PUT /api/leave-requests/:id
router.put(
  "/:id",
  requireHrAccess("leave_request.update"),
  validate(leaveRequestIdParamSchema, "params"),
  validate(updateLeaveRequestSchema, "body"),
  updateLeaveRequest
);

// PATCH /api/leave-requests/:id/status — Approve/Reject/change status
// NOTE ON ACTION LABEL: leave_status is a free-standing FK into
// erp_hrm_leave_statuses (not a fixed enum like loan requests' status —
// see loanRequest.routes.ts for that contrast), so there's no fixed
// PENDING/APPROVED/REJECTED constant to translate the submitted id into a
// friendly word without an extra DB lookup. Logged as the generic
// "status_changed" action with the submitted leave_status id captured in
// new_values — still fully traceable, just not pre-labelled "approved" vs
// "rejected" the way the Loan Request logging below is.
router.patch(
  "/:id/status",
  requireHrAccess("leave_request.approve"),
  validate(leaveRequestIdParamSchema, "params"),
  validate(changeLeaveRequestStatusSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.LEAVE,
    action: ACTIVITY_ACTION.STATUS_CHANGED,
    loadPrevious: (req) => fetchLeaveRequestById(Number(req.params.id)),
  }),
  changeLeaveRequestStatus
);

// DELETE /api/leave-requests/:id
router.delete(
  "/:id",
  requireHrAccess("leave_request.delete"), validate(leaveRequestIdParamSchema, "params"), deleteLeaveRequest);

export default router;