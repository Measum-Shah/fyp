import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as bankAccountService from "../services/bankAccount.service";
import {
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from "../validators/bankAccount.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

// ─── Shared error responder ──────────────────────────────────────────────────
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A bank account with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bank account not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /bank-accounts ───────────────────────────────────────────────────────
export const getBankAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      status?: string;
    };

    const scope = await resolveRecordScope(req, "bank_account");
    const result = await bankAccountService.listBankAccounts({ page, limit, search, staff_id, status }, scope);

    return res.status(200).json({
      message: "Bank accounts fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetBankAccounts error:");
  }
};

// ─── GET /bank-accounts/:id ───────────────────────────────────────────────────
export const getBankAccountById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "bank_account");
    const record = await bankAccountService.getBankAccountById(id, scope);

    return res.status(200).json({ message: "Bank account fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetBankAccountById error:");
  }
};

// ─── POST /bank-accounts ──────────────────────────────────────────────────────
export const createBankAccount = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateBankAccountInput;
    const record = await bankAccountService.createBankAccount(input);

    return res.status(201).json({ message: "Bank account created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateBankAccount error:");
  }
};

// ─── PUT /bank-accounts/:id ───────────────────────────────────────────────────
export const updateBankAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateBankAccountInput;

    const record = await bankAccountService.updateBankAccount(id, input);

    return res.status(200).json({ message: "Bank account updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateBankAccount error:");
  }
};

// ─── DELETE /bank-accounts/:id ────────────────────────────────────────────────
export const deleteBankAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await bankAccountService.deleteBankAccount(id);

    return res.status(200).json({ message: "Bank account deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteBankAccount error:");
  }
};
