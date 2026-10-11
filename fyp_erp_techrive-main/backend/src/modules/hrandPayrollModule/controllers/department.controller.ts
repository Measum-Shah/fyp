import { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as departmentService from "../services/department.service";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "../validators/department.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors employee.controller.ts's handleError exactly.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A department with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Department not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /departments ─────────────────────────────────────────────────────────
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { page, limit, search } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
    };

    const branchIds = await resolveRoleBranchIds(req);
    const result = await departmentService.listDepartments({ page, limit, search }, branchIds);

    return res.status(200).json({
      message: "Departments fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetDepartments error:");
  }
};

// ─── GET /departments/:id ─────────────────────────────────────────────────────
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const department = await departmentService.getDepartmentById(id, branchIds);

    return res.status(200).json({
      message: "Department fetched successfully",
      data: department,
    });
  } catch (error) {
    return handleError(res, error, "GetDepartmentById error:");
  }
};

// ─── POST /departments ────────────────────────────────────────────────────────
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateDepartmentInput;
    const department = await departmentService.createDepartment(input);

    return res.status(201).json({
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    return handleError(res, error, "CreateDepartment error:");
  }
};

// ─── PUT /departments/:id ─────────────────────────────────────────────────────
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateDepartmentInput;

    const department = await departmentService.updateDepartment(id, input);

    return res.status(200).json({
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    return handleError(res, error, "UpdateDepartment error:");
  }
};

// ─── DELETE /departments/:id ──────────────────────────────────────────────────
export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await departmentService.deleteDepartment(id, req.user?.id);

    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteDepartment error:");
  }
};