import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { createUploader } from "../middlewares/upload.middleware";
import {
  createStaffAsset,
  deleteStaffAsset,
  getStaffAssetById,
  getStaffAssets,
  updateStaffAsset,
  uploadStaffAssetAttachment,
} from "../controllers/staffAsset.controller";
import {
  createStaffAssetSchema,
  listStaffAssetsQuerySchema,
  staffAssetIdParamSchema,
  updateStaffAssetSchema,
} from "../validators/staffAsset.validator";
import { STAFF_ASSET_UPLOAD_SUBDIR } from "../constants/staffAsset.constants";

const router = Router();

router.use(authMiddleware);

const assetUpload = createUploader(STAFF_ASSET_UPLOAD_SUBDIR);

// GET /api/staff-assets?staff_id=123
router.get(
  "/",
  requireHrAccess("staff_asset.view"), validate(listStaffAssetsQuerySchema, "query"), getStaffAssets);

// POST /api/staff-assets/upload-attachment (multipart, field name "file")
// NOTE: declared before "/:id" so the literal path always wins the match.
router.post(
  "/upload-attachment",
  requireHrAccess("staff_asset.create"), assetUpload.single("file"), uploadStaffAssetAttachment);

// GET /api/staff-assets/:id
router.get(
  "/:id",
  requireHrAccess("staff_asset.view"), validate(staffAssetIdParamSchema, "params"), getStaffAssetById);

// POST /api/staff-assets
router.post(
  "/",
  requireHrAccess("staff_asset.create"), validate(createStaffAssetSchema, "body"), createStaffAsset);

// PUT /api/staff-assets/:id
router.put(
  "/:id",
  requireHrAccess("staff_asset.update"),
  validate(staffAssetIdParamSchema, "params"),
  validate(updateStaffAssetSchema, "body"),
  updateStaffAsset
);

// DELETE /api/staff-assets/:id
router.delete(
  "/:id",
  requireHrAccess("staff_asset.delete"), validate(staffAssetIdParamSchema, "params"), deleteStaffAsset);

export default router;