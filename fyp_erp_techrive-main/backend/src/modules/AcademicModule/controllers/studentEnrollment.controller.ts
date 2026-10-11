import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { StudentEnrollmentService } from "../services/studentEnrollment.service";
import {
  toStudentPhotoPublicPath,
  unlinkStudentPhotoFile,
} from "../middlewares/studentEnrollmentUpload.middleware";

const handleError = (error: unknown, res: Response) => {
  const err = error as { statusCode?: number; message?: string };
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Student Enrollment request failed",
  });
};

const parseMaybeJson = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
};

export const getLookups = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const branchId = req.query.branch_id
      ? Number(req.query.branch_id)
      : undefined;
    const data = await StudentEnrollmentService.getLookups(
      Number.isFinite(branchId) ? branchId : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res);
  }
};

export const listEnrollments = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await StudentEnrollmentService.listEnrollments({
      branch_id: req.query.branch_id
        ? Number(req.query.branch_id)
        : undefined,
      admission_status: req.query.admission_status
        ? String(req.query.admission_status)
        : undefined,
      search: req.query.search ? String(req.query.search) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res);
  }
};

export const getEnrollment = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const data = await StudentEnrollmentService.getEnrollment(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res);
  }
};

export const createEnrollment = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  const uploaded = (req as AuthRequest & { file?: Express.Multer.File }).file;
  const student_image = uploaded
    ? toStudentPhotoPublicPath(uploaded.filename)
    : null;

  try {
    const body = req.body || {};
    const parentRaw = parseMaybeJson(body.parent);
    const data = await StudentEnrollmentService.createEnrollment({
      ...body,
      student_image,
      parent:
        parentRaw && typeof parentRaw === "object"
          ? parentRaw
          : {
              father_first_name: body.father_first_name,
              father_middle_name: body.father_middle_name,
              father_last_name: body.father_last_name,
              father_cnic: body.father_cnic,
              father_occupation: body.father_occupation,
              father_office: body.father_office,
              father_office_number: body.father_office_number,
              father_mobile_1: body.father_mobile_1,
              father_email: body.father_email,
              father_is_staff: body.father_is_staff,
              father_staff_ref: body.father_staff_ref,
              mother_first_name: body.mother_first_name,
              mother_middle_name: body.mother_middle_name,
              mother_last_name: body.mother_last_name,
              mother_cnic: body.mother_cnic,
              mother_occupation: body.mother_occupation,
              mother_office: body.mother_office,
              mother_office_number: body.mother_office_number,
              mother_mobile_1: body.mother_mobile_1,
              mother_email: body.mother_email,
              mother_is_staff: body.mother_is_staff,
              mother_staff_ref: body.mother_staff_ref,
              guardian_is: body.guardian_is,
              guardian_first_name: body.guardian_first_name,
              guardian_middle_name: body.guardian_middle_name,
              guardian_last_name: body.guardian_last_name,
              guardian_cnic: body.guardian_cnic,
              guardian_occupation: body.guardian_occupation,
              guardian_relation: body.guardian_relation,
              guardian_mobile_1: body.guardian_mobile_1,
              guardian_email: body.guardian_email,
              guardian_address: body.guardian_address,
              guardian_is_staff: body.guardian_is_staff,
              guardian_staff_ref: body.guardian_staff_ref,
            },
      created_by: req.user?.id,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (uploaded?.path) unlinkStudentPhotoFile(uploaded.path);
    handleError(error, res);
  }
};

export const verifyFee = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const data = await StudentEnrollmentService.verifyFeeAndRegister(id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res);
  }
};
