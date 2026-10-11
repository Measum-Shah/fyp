import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  createUser,
  deleteUser,
  getEmployeesLookup,
  getUserById,
  getUsers,
  resetPassword,
  updateUser,
} from "../controllers/user.controller";
import { getUserById as fetchUserById } from "../services/user.service";
import {
  createUserSchema,
  listUsersQuerySchema,
  resetPasswordSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.validator";

const router = Router();

// All User Account routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/users/lookups/employees — MUST be registered before "/:id" or
// Express would try to match "lookups" itself as the :id param and fail
// validation there (same reasoning as loanRequest.routes.ts's
// /lookups/employees).
router.get("/lookups/employees", requireHrAccess("directory.read"), getEmployeesLookup);

// GET /api/users
router.get("/", requireHrAccess("user.view"), validate(listUsersQuerySchema, "query"), getUsers);

// GET /api/users/:id
router.get(
  "/:id",
  requireHrAccess("user.view"),
  validate(userIdParamSchema, "params"),
  getUserById
);

// POST /api/users
router.post(
  "/",
  requireHrAccess("user.create"),
  validate(createUserSchema, "body"),
  auditLog({ module: ACTIVITY_MODULE.USER, action: ACTIVITY_ACTION.CREATED }),
  createUser
);

// PUT /api/users/:id
router.put(
  "/:id",
  requireHrAccess("user.update"),
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.USER,
    action: ACTIVITY_ACTION.UPDATED,
    loadPrevious: (req) => fetchUserById(Number(req.params.id)),
  }),
  updateUser
);

// PUT /api/users/:id/reset-password
router.put(
  "/:id/reset-password",
  requireHrAccess("user.reset_password"),
  validate(userIdParamSchema, "params"),
  validate(resetPasswordSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.USER,
    action: ACTIVITY_ACTION.STATUS_CHANGED,
    description: () => "Password reset by an administrator",
  }),
  resetPassword
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  requireHrAccess("user.delete"),
  validate(userIdParamSchema, "params"),
  auditLog({
    module: ACTIVITY_MODULE.USER,
    action: ACTIVITY_ACTION.DELETED,
    loadPrevious: (req) => fetchUserById(Number(req.params.id)),
    getRecordId: (req) => String(req.params.id),
  }),
  deleteUser
);

export default router;
