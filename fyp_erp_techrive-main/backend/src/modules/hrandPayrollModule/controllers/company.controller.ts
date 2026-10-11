import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as companyService from "../services/company.service";
import { CreateCompanyInput, UpdateCompanyInput } from "../validators/company.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors branch.controller.ts's/department.controller.ts's handleError.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A school / university with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "School / University not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /companies ───────────────────────────────────────────────────────────
export const getCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await companyService.listCompanies({ page, limit, search, status });

    return res.status(200).json({
      message: "School / University fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetCompanies error:");
  }
};

// ─── GET /companies/:id ───────────────────────────────────────────────────────
export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const company = await companyService.getCompanyById(id);

    return res.status(200).json({ message: "School / University fetched successfully", data: company });
  } catch (error) {
    return handleError(res, error, "GetCompanyById error:");
  }
};

// ─── POST /companies ──────────────────────────────────────────────────────────
export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateCompanyInput;
    const company = await companyService.createCompany(input, req.user?.id);

    return res.status(201).json({ message: "School / University created successfully", data: company });
  } catch (error) {
    return handleError(res, error, "CreateCompany error:");
  }
};

// ─── PUT /companies/:id ────────────────────────────────────────────────────────
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateCompanyInput;

    const company = await companyService.updateCompany(id, input, req.user?.id);

    return res.status(200).json({ message: "School / University updated successfully", data: company });
  } catch (error) {
    return handleError(res, error, "UpdateCompany error:");
  }
};

// ─── DELETE /companies/:id ──────────────────────────────────────────────────────
export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await companyService.deleteCompany(id, req.user?.id);

    return res.status(200).json({ message: "School / University deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteCompany error:");
  }
};