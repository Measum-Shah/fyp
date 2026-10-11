import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as loanRequestService from "../services/loanRequest.service";
import {
  ChangeLoanRequestStatusInput,
  CreateLoanRequestInput,
  UpdateLoanRequestInput,
} from "../validators/loanRequest.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import { toPublicUploadPath } from "../middlewares/upload.middleware";
import { LOAN_REQUEST_ATTACHMENT_UPLOAD_SUBDIR } from "../constants/loanRequest.constants";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "A loan request with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Loan request not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /loan-requests ────────────────────────────────────────────────────────
export const getLoanRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, branch_id, company_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      branch_id?: number;
      company_id?: number;
      status?: number;
    };

    const scope = await resolveRecordScope(req, "loan_request");
    const result = await loanRequestService.listLoanRequests(
      {
        page,
        limit,
        search,
        staff_id,
        branch_id,
        company_id,
        status,
      },
      scope
    );

    return res.status(200).json({
      message: "Loan requests fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetLoanRequests error:");
  }
};

// ─── GET /loan-requests/lookups/employees ────────────────────────────────────
export const getEmployeeLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await loanRequestService.listEmployeeLookup();
    return res.status(200).json({ message: "Employees fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetEmployeeLookup error:");
  }
};

// ─── GET /loan-requests/:id ───────────────────────────────────────────────────
export const getLoanRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "loan_request");
    const loanRequest = await loanRequestService.getLoanRequestById(id, scope);

    return res
      .status(200)
      .json({ message: "Loan request fetched successfully", data: loanRequest });
  } catch (error) {
    return handleError(res, error, "GetLoanRequestById error:");
  }
};

// ─── POST /loan-requests ──────────────────────────────────────────────────────
export const createLoanRequest = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLoanRequestInput;
    const loanRequest = await loanRequestService.createLoanRequest(input, req.user?.id);

    return res
      .status(201)
      .json({ message: "Loan request created successfully", data: loanRequest });
  } catch (error) {
    return handleError(res, error, "CreateLoanRequest error:");
  }
};

// ─── PUT /loan-requests/:id ───────────────────────────────────────────────────
export const updateLoanRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLoanRequestInput;

    const loanRequest = await loanRequestService.updateLoanRequest(id, input, req.user?.id);

    return res
      .status(200)
      .json({ message: "Loan request updated successfully", data: loanRequest });
  } catch (error) {
    return handleError(res, error, "UpdateLoanRequest error:");
  }
};

// ─── PATCH /loan-requests/:id/status ──────────────────────────────────────────
export const changeLoanRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as ChangeLoanRequestStatusInput;

    const loanRequest = await loanRequestService.changeLoanRequestStatus(
      id,
      input,
      req.user?.id
    );

    return res
      .status(200)
      .json({ message: "Loan request status updated successfully", data: loanRequest });
  } catch (error) {
    return handleError(res, error, "ChangeLoanRequestStatus error:");
  }
};

// ─── POST /loan-requests/upload-attachment ───────────────────────────────────
// Mirrors uploadResignationExperienceLetter — see LoanRequestFormModal.tsx
// for the click-to-upload UI pattern this is paired with. Returns the
// public path to store as attachment_file.
export const uploadLoanRequestAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const attachment_file = toPublicUploadPath(LOAN_REQUEST_ATTACHMENT_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Attachment uploaded successfully",
      data: { attachment_file },
    });
  } catch (error) {
    return handleError(res, error, "UploadLoanRequestAttachment error:");
  }
};

// ─── DELETE /loan-requests/:id ────────────────────────────────────────────────
export const deleteLoanRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await loanRequestService.deleteLoanRequest(id, req.user?.id);

    return res.status(200).json({ message: "Loan request deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLoanRequest error:");
  }
};