import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as leaveRequestService from "../services/leaveRequest.service";
import {
  ChangeLeaveRequestStatusInput,
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
} from "../validators/leaveRequest.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import { LEAVE_REQUEST_UPLOAD_SUBDIR } from "../constants/leaveRequest.constants";
import { toPublicUploadPath } from "../middlewares/upload.middleware";

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
        .json({ message: "A leave request with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave request not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /leave-requests ──────────────────────────────────────────────────────
export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page,
      limit,
      search,
      employee_id,
      leave_type_id,
      leave_status,
      branch_id,
      company_id,
    } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      employee_id?: number;
      leave_type_id?: number;
      leave_status?: number;
      branch_id?: number;
      company_id?: number;
    };

    const scope = await resolveRecordScope(req, "leave_request");
    const result = await leaveRequestService.listLeaveRequests(
      {
        page,
        limit,
        search,
        employee_id,
        leave_type_id,
        leave_status,
        branch_id,
        company_id,
      },
      scope
    );

    return res.status(200).json({
      message: "Leave requests fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveRequests error:");
  }
};

// ─── GET /leave-requests/lookups/employees ───────────────────────────────────
export const getEmployeeLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await leaveRequestService.listEmployeeLookup();
    return res.status(200).json({ message: "Employees fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetEmployeeLookup error:");
  }
};

// ─── GET /leave-requests/:id ──────────────────────────────────────────────────
export const getLeaveRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "leave_request");
    const leaveRequest = await leaveRequestService.getLeaveRequestById(id, scope);

    return res
      .status(200)
      .json({ message: "Leave request fetched successfully", data: leaveRequest });
  } catch (error) {
    return handleError(res, error, "GetLeaveRequestById error:");
  }
};

// ─── POST /leave-requests ─────────────────────────────────────────────────────
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLeaveRequestInput;
    const leaveRequest = await leaveRequestService.createLeaveRequest(input, req.user?.id);

    return res
      .status(201)
      .json({ message: "Leave request created successfully", data: leaveRequest });
  } catch (error) {
    return handleError(res, error, "CreateLeaveRequest error:");
  }
};

// ─── PUT /leave-requests/:id ──────────────────────────────────────────────────
export const updateLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLeaveRequestInput;

    const leaveRequest = await leaveRequestService.updateLeaveRequest(id, input, req.user?.id);

    return res
      .status(200)
      .json({ message: "Leave request updated successfully", data: leaveRequest });
  } catch (error) {
    return handleError(res, error, "UpdateLeaveRequest error:");
  }
};

// ─── PATCH /leave-requests/:id/status ─────────────────────────────────────────
// Powers the Approve/Reject/change-status action on the Leave Requests table.
export const changeLeaveRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as ChangeLeaveRequestStatusInput;

    const leaveRequest = await leaveRequestService.changeLeaveRequestStatus(
      id,
      input,
      req.user?.id
    );

    return res
      .status(200)
      .json({ message: "Leave request status updated successfully", data: leaveRequest });
  } catch (error) {
    return handleError(res, error, "ChangeLeaveRequestStatus error:");
  }
};

// ─── POST /leave-requests/upload-attachment ──────────────────────────────────
// Standalone endpoint: the file is uploaded first, the returned public path
// is then sent as the `attachment` field on the normal create/update JSON
// request — same pattern as Staff Qualifications/Staff Assets uploads.
export const uploadLeaveRequestAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const attachment = toPublicUploadPath(LEAVE_REQUEST_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Attachment uploaded successfully",
      data: { attachment },
    });
  } catch (error) {
    return handleError(res, error, "UploadLeaveRequestAttachment error:");
  }
};

// ─── DELETE /leave-requests/:id ───────────────────────────────────────────────
export const deleteLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await leaveRequestService.deleteLeaveRequest(id, req.user?.id);

    return res.status(200).json({ message: "Leave request deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLeaveRequest error:");
  }
};