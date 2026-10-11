import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as userService from "../services/user.service";
import { CreateUserBody, ListUsersQuery, ResetPasswordBody, UpdateUserBody } from "../validators/user.validator";

// ─── Shared error responder ─────────────────────────────────────────────────
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A user with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /users ──────────────────────────────────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query as unknown as ListUsersQuery;
    const result = await userService.listUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return res.status(200).json({ message: "Users fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetUsers error:");
  }
};

// ─── GET /users/:id ──────────────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const user = await userService.getUserById(id);

    return res.status(200).json({ message: "User fetched successfully", data: user });
  } catch (error) {
    return handleError(res, error, "GetUserById error:");
  }
};

// ─── POST /users ─────────────────────────────────────────────────────────────
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as CreateUserBody;
    const user = await userService.createUser(body);

    return res.status(201).json({ message: "User created successfully", data: user });
  } catch (error) {
    return handleError(res, error, "CreateUser error:");
  }
};

// ─── PUT /users/:id ──────────────────────────────────────────────────────────
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const body = req.body as UpdateUserBody;
    const user = await userService.updateUser(id, body, req.user?.id);

    return res.status(200).json({ message: "User updated successfully", data: user });
  } catch (error) {
    return handleError(res, error, "UpdateUser error:");
  }
};

// ─── PUT /users/:id/reset-password ───────────────────────────────────────────
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const { password } = req.body as ResetPasswordBody;
    await userService.resetPassword(id, password);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return handleError(res, error, "ResetPassword error:");
  }
};

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await userService.deleteUser(id, req.user?.id);

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteUser error:");
  }
};

// ─── GET /users/lookups/employees ─────────────────────────────────────────────
export const getEmployeesLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await userService.listLinkableEmployees();
    return res.status(200).json({ message: "Employees fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetEmployeesLookup error:");
  }
};
