import { Request, Response } from "express";
import { prisma } from "../../../config/db";

/**
 * Returns lists of Programs, Sessions, and Terms for dropdown selects.
 */
export class LookupController {
  static async getResultLookups(req: Request, res: Response) {
    try {
      const [programs, sessions, terms] = await Promise.all([
        prisma.programs.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.sessions.findMany({
          where: { status: "Active" },
          select: { id: true, title: true, start_year: true, end_year: true },
          orderBy: { id: "desc" },
        }),
        prisma.terms.findMany({
          where: { status: "Active" },
          select: { id: true, name: true, start_year: true, end_year: true },
          orderBy: { id: "asc" },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: { programs, sessions, terms },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
