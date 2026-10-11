import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { CalendarService } from "../services/calendar.service";

const requireAdmin = (req: AuthRequest) => {
  const userType = String(req.user?.user_type || "").toLowerCase();
  if (!req.user || !["admin", "superadmin"].includes(userType)) {
    throw new Error("Unauthorized: Admin access required.");
  }
};

const parseDate = (value: unknown): Date => {
  if (!value) throw new Error("Date value is required.");
  const d = new Date(String(value));
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
};

export class CalendarController {
  /** GET /academic/calendar — any authenticated user */
  static async list(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branch_id
        ? Number(req.query.branch_id)
        : undefined;
      const data = await CalendarService.list(branchId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /** POST /academic/calendar — admin only */
  static async create(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const { title, start, end, type, color, branch_id } = req.body;
      if (!title?.trim()) throw new Error("Title is required.");
      if (!start) throw new Error("Start date is required.");
      if (!end) throw new Error("End date is required.");

      const data = await CalendarService.create({
        title: String(title).trim(),
        start: parseDate(start),
        end: parseDate(end),
        type: type || "National Holiday",
        color: color || "green",
        branch_id: branch_id ? Number(branch_id) : null,
        created_by: req.user?.id ?? null,
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /** PUT /academic/calendar/:id — admin only */
  static async update(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const id = Number(req.params.id);
      if (!id) throw new Error("Invalid event ID.");
      const { title, start, end, type, color, branch_id } = req.body;

      const data = await CalendarService.update(id, {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(start !== undefined && { start: parseDate(start) }),
        ...(end !== undefined && { end: parseDate(end) }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
        ...(branch_id !== undefined && {
          branch_id: branch_id ? Number(branch_id) : null,
        }),
      });
      res.json({ success: true, data });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /** DELETE /academic/calendar/:id — admin only */
  static async remove(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const id = Number(req.params.id);
      if (!id) throw new Error("Invalid event ID.");
      await CalendarService.remove(id);
      res.json({ success: true });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}
