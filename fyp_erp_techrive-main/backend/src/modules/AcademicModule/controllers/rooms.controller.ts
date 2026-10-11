import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { RoomsService } from "../services/rooms.service";

const requireAdmin = (req: AuthRequest) => {
  const userType = String(req.user?.user_type || "").toLowerCase();
  if (!req.user || !["admin", "superadmin"].includes(userType)) {
    throw new Error("Unauthorized: Admin access required.");
  }
};

export class RoomsController {
  static async list(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const data = await RoomsService.list();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message });
    }
  }

  static async lookups(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const data = await RoomsService.lookups();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const { name, department_id, status } = req.body;
      if (!name?.trim()) throw new Error("Room name is required.");

      const data = await RoomsService.create({
        name: String(name).trim(),
        department_id: department_id ? Number(department_id) : null,
        status: status || "Active",
        created_by: req.user?.id ?? null,
      });
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const id = Number(req.params.id);
      if (!id) throw new Error("Invalid room ID.");
      const { name, department_id, status } = req.body;

      const data = await RoomsService.update(id, {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(department_id !== undefined && { department_id: department_id ? Number(department_id) : null }),
        ...(status !== undefined && { status }),
        updated_by: req.user?.id ?? null,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const id = Number(req.params.id);
      if (!id) throw new Error("Invalid room ID.");
      await RoomsService.remove(id, req.user?.id ?? undefined);
      res.json({ success: true });
    } catch (error: any) {
      const status = error.message.includes("Unauthorized") ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}
