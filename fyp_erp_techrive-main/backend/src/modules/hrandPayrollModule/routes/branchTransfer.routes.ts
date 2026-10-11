import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createBranchTransfer,
  deleteBranchTransfer,
  getBranchTransferById,
  getBranchTransfers,
  updateBranchTransfer,
  updateBranchTransferApproval,
} from "../controllers/branchTransfer.controller";
import {
  branchTransferIdParamSchema,
  createBranchTransferSchema,
  listBranchTransfersQuerySchema,
  updateBranchTransferApprovalSchema,
  updateBranchTransferSchema,
} from "../validators/branchTransfer.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/branch-transfers
router.get(
  "/",
  requireHrAccess("branch_transfer.view"), validate(listBranchTransfersQuerySchema, "query"), getBranchTransfers);

// GET /api/branch-transfers/:id
router.get(
  "/:id",
  requireHrAccess("branch_transfer.view"), validate(branchTransferIdParamSchema, "params"), getBranchTransferById);

// POST /api/branch-transfers
router.post(
  "/",
  requireHrAccess("branch_transfer.create"), validate(createBranchTransferSchema, "body"), createBranchTransfer);

// PUT /api/branch-transfers/:id
router.put(
  "/:id",
  requireHrAccess("branch_transfer.update"),
  validate(branchTransferIdParamSchema, "params"),
  validate(updateBranchTransferSchema, "body"),
  updateBranchTransfer
);

// PATCH /api/branch-transfers/:id/approval
router.patch(
  "/:id/approval",
  requireHrAccess("branch_transfer.approve"),
  validate(branchTransferIdParamSchema, "params"),
  validate(updateBranchTransferApprovalSchema, "body"),
  updateBranchTransferApproval
);

// DELETE /api/branch-transfers/:id
router.delete(
  "/:id",
  requireHrAccess("branch_transfer.delete"), validate(branchTransferIdParamSchema, "params"), deleteBranchTransfer);

export default router;
