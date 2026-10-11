import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// ─── validate ──────────────────────────────────────────────────────────────
// Generic request-validation middleware, scoped to the HR & Payroll module
// (kept local here rather than in the shared `src/middlewares` folder, since
// only files inside `hrandPayrollModule` may be added/changed at this time).
//
// Pass a Zod schema for whichever part of the request needs validating
// ("body" | "params" | "query") and it will parse + replace that part of the
// request with the parsed value, or respond with 422 and a field-level
// breakdown of what went wrong.
//
// Usage:
//   router.post("/", validate(createEmployeeSchema, "body"), createEmployee);
//   router.get("/:id", validate(employeeIdParamSchema, "params"), getEmployeeById);

type RequestPart = "body" | "params" | "query";

export const validate =
  (schema: ZodType, part: RequestPart = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || part;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }

      return res.status(422).json({
        message: "Validation failed",
        errors,
      });
    }

    // Replace with the parsed (and possibly transformed/coerced) data.
    // NOTE: Express 5 exposes `req.query` as a getter-only accessor that
    // re-parses the raw query string on every access (no caching), so
    // neither `req.query = x` nor `Object.assign(req.query, x)` persists.
    // We have to redefine the property itself with a static value.
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      (req as any)[part] = result.data;
    }
    next();
  };