import { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as employeeService from "../services/employee.service";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "../validators/employee.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import {
  EMPLOYEE_CNIC_ATTACHMENT_UPLOAD_SUBDIR,
  EMPLOYEE_PROFILE_IMAGE_UPLOAD_SUBDIR,
} from "../constants/employee.constants";
import { toPublicUploadPath } from "../middlewares/upload.middleware";

// ─── Shared error responder ──────────────────────────────────────────────────
// Controllers stay thin: catch, translate, respond. No business logic here.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  // Prisma-level unique constraint / not-found safety net, in case a race
  // condition slips past the service-layer checks.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A record with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Employee not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /employees ──────────────────────────────────────────────────────────
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, department_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      department_id?: number;
      status?: string;
    };

    const scope = await resolveRecordScope(req, "employee");
    const result = await employeeService.listEmployees(
      {
        page,
        limit,
        search,
        department_id,
        status,
      },
      scope
    );

    return res.status(200).json({
      message: "Employees fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetEmployees error:");
  }
};

// ─── GET /employees/:id ──────────────────────────────────────────────────────
export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "employee");
    const employee = await employeeService.getEmployeeById(id, scope);

    return res.status(200).json({
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    return handleError(res, error, "GetEmployeeById error:");
  }
};

// ─── POST /employees ─────────────────────────────────────────────────────────
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateEmployeeInput;
    const employee = await employeeService.createEmployee(input);

    return res.status(201).json({
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    return handleError(res, error, "CreateEmployee error:");
  }
};

// ─── PUT /employees/:id ───────────────────────────────────────────────────────
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateEmployeeInput;

    const employee = await employeeService.updateEmployee(id, input);

    return res.status(200).json({
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    return handleError(res, error, "UpdateEmployee error:");
  }
};

// ─── POST /employees/upload-profile-image (multipart, field name "file") ─────
// Uploads only; the returned `staff_image` path is then sent as a normal
// field on createEmployee/updateEmployee above — keeps those two calls plain
// JSON, matching Staff Qualifications' / Staff Assets' upload-attachment
// convention.
export const uploadEmployeeProfileImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const staff_image = toPublicUploadPath(EMPLOYEE_PROFILE_IMAGE_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Profile picture uploaded successfully",
      data: { staff_image },
    });
  } catch (error) {
    return handleError(res, error, "UploadEmployeeProfileImage error:");
  }
};

// ─── POST /employees/upload-cnic-attachment (multipart, field name "file") ───
export const uploadEmployeeCnicAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const cnic_attachment = toPublicUploadPath(EMPLOYEE_CNIC_ATTACHMENT_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "CNIC attachment uploaded successfully",
      data: { cnic_attachment },
    });
  } catch (error) {
    return handleError(res, error, "UploadEmployeeCnicAttachment error:");
  }
};

// ─── DELETE /employees/:id ────────────────────────────────────────────────────
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await employeeService.deleteEmployee(id, req.user?.id);

    return res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    return handleError(res, error, "DeleteEmployee error:");
  }
};