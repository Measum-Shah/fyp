import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { createUploader } from "../middlewares/upload.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
  uploadEmployeeCnicAttachment,
  uploadEmployeeProfileImage,
} from "../controllers/employee.controller";
import { getEmployeeById as fetchEmployeeById } from "../services/employee.service";
import {
  getBranches,
  getDepartments,
  getDesignations,
  getStaff,
  getStaffTypes,
  getEmployeesSearch,} from "../controllers/lookup.controller";
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../validators/employee.validator";
import {
  EMPLOYEE_CNIC_ATTACHMENT_UPLOAD_SUBDIR,
  EMPLOYEE_PROFILE_IMAGE_UPLOAD_SUBDIR,
} from "../constants/employee.constants";

const router = Router();

// All Employee Management routes require an authenticated ERP user
router.use(authMiddleware);

const profileImageUpload = createUploader(EMPLOYEE_PROFILE_IMAGE_UPLOAD_SUBDIR);
const cnicAttachmentUpload = createUploader(EMPLOYEE_CNIC_ATTACHMENT_UPLOAD_SUBDIR);

// GET /api/employees
router.get("/", requireHrAccess("employee.view"), validate(listEmployeesQuerySchema, "query"), getEmployees);

// ─── File uploads for the Add/Edit Employee form ────────────────────────────
// IMPORTANT: declared before "/:id" — otherwise Express would try to match
// "upload-profile-image" / "upload-cnic-attachment" as the :id param.
// Gated as employee.update — both are attachment-edit actions on a profile
// (new or existing), not a standalone create.
// POST /api/employees/upload-profile-image (multipart, field name "file")
router.post(
  "/upload-profile-image",
  requireHrAccess("employee.update"),
  profileImageUpload.single("file"),
  uploadEmployeeProfileImage
);
// POST /api/employees/upload-cnic-attachment (multipart, field name "file")
router.post(
  "/upload-cnic-attachment",
  requireHrAccess("employee.update"),
  cnicAttachmentUpload.single("file"),
  uploadEmployeeCnicAttachment
);

// ─── Lookups for the Add/Edit Employee form dropdowns ───────────────────────
// IMPORTANT: these MUST be registered before "/:id" — otherwise Express would
// try to match "lookups" itself as the :id param and fail validation there.
//
// Every one of these just needs requireHrAccess() — any admin/hr login
// that reached this module at all is meant to see every dropdown, since
// these endpoints (esp. /lookups/staff) are reused by several unrelated
// modules — Bank Accounts, Salary Sheet, Loans, Increments, EOBI Register.
// GET /api/employees/lookups/departments
router.get("/lookups/departments", requireHrAccess("directory.read"), getDepartments);
// GET /api/employees/lookups/branches
router.get("/lookups/branches", requireHrAccess("directory.read"), getBranches);
// GET /api/employees/lookups/designations
router.get("/lookups/designations", requireHrAccess("directory.read"), getDesignations);
// GET /api/employees/lookups/staff-types
router.get("/lookups/staff-types", requireHrAccess("directory.read"), getStaffTypes);
// GET /api/employees/lookups/search?q=…
router.get("/lookups/search", requireHrAccess("directory.read"), getEmployeesSearch);

// GET /api/employees/lookups/staff
// Shared "pick an employee" dropdown consumed by the Payroll & Salary
// features (Bank Accounts, Salary Sheet, Loans, Increments, EOBI/EPF
// Register) — see lookup.service.ts's listStaff() for why it lives here.
router.get("/lookups/staff", requireHrAccess("directory.read"), getStaff);

// GET /api/employees/:id
router.get(
  "/:id",
  requireHrAccess("employee.view"),
  validate(employeeIdParamSchema, "params"),
  getEmployeeById
);

// POST /api/employees
router.post(
  "/",
  requireHrAccess("employee.create"),
  validate(createEmployeeSchema, "body"),
  auditLog({ module: ACTIVITY_MODULE.EMPLOYEE, action: ACTIVITY_ACTION.CREATED }),
  createEmployee
);

// PUT /api/employees/:id
router.put(
  "/:id",
  requireHrAccess("employee.update"),
  validate(employeeIdParamSchema, "params"),
  validate(updateEmployeeSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.EMPLOYEE,
    action: ACTIVITY_ACTION.UPDATED,
    loadPrevious: (req) => fetchEmployeeById(Number(req.params.id)),
  }),
  updateEmployee
);

// DELETE /api/employees/:id
router.delete(
  "/:id",
  requireHrAccess("employee.delete"),
  validate(employeeIdParamSchema, "params"),
  auditLog({
    module: ACTIVITY_MODULE.EMPLOYEE,
    action: ACTIVITY_ACTION.DELETED,
    loadPrevious: (req) => fetchEmployeeById(Number(req.params.id)),
    getRecordId: (req) => String(req.params.id),
  }),
  deleteEmployee
);

export default router;