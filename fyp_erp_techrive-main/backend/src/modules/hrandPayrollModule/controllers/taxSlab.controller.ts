import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as taxSlabService from "../services/taxSlab.service";
import { CreateTaxSlabInput, UpdateTaxSlabInput } from "../validators/taxSlab.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ message: "A tax slab with these details already exists" });
    if (error.code === "P2025") return res.status(404).json({ message: "Tax slab not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getTaxSlabs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, fiscal_year_id, status } = req.query as unknown as {
      page: number; limit: number; fiscal_year_id?: number; status?: number;
    };
    const result = await taxSlabService.listTaxSlabs({ page, limit, fiscal_year_id, status });
    return res.status(200).json({ message: "Tax slabs fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetTaxSlabs error:");
  }
};

// GET /tax-slabs/by-fiscal-year/:fiscalYearId — unpaginated, full ladder for
// one fiscal year. MUST be registered before "/:id" in the router.
export const getTaxSlabsForFiscalYear = async (req: AuthRequest, res: Response) => {
  try {
    const { fiscalYearId } = req.params as unknown as { fiscalYearId: number };
    const result = await taxSlabService.listTaxSlabsForFiscalYear(Number(fiscalYearId));
    return res.status(200).json({
      message: "Tax slabs fetched successfully",
      data: result.data,
      missing_unbounded_top_slab_warning: result.missing_unbounded_top_slab_warning,
    });
  } catch (error) {
    return handleError(res, error, "GetTaxSlabsForFiscalYear error:");
  }
};

export const getTaxSlabById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await taxSlabService.getTaxSlabById(id);
    return res.status(200).json({ message: "Tax slab fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetTaxSlabById error:");
  }
};

export const createTaxSlab = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateTaxSlabInput;
    const record = await taxSlabService.createTaxSlab(input);
    return res.status(201).json({ message: "Tax slab created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateTaxSlab error:");
  }
};

export const updateTaxSlab = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateTaxSlabInput;
    const record = await taxSlabService.updateTaxSlab(id, input);
    return res.status(200).json({ message: "Tax slab updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateTaxSlab error:");
  }
};

export const deleteTaxSlab = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await taxSlabService.deleteTaxSlab(id);
    return res.status(200).json({ message: "Tax slab deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteTaxSlab error:");
  }
};
