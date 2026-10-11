import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export const asyncHandler =
  (
    fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req.body = parsed.data;
    next();
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    (req as Request & { validatedQuery: unknown }).validatedQuery = parsed.data;
    next();
  };

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "Success",
  status = 200
) => res.status(status).json({ message, data });

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "item";

export const toInt = (value: unknown, fallback?: number): number | undefined => {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export const parseDateOnly = (value: string | Date): Date => {
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid date: ${value}`);
  }
  return d;
};
