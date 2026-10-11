import { Request, Response } from "express";
import { EnrollmentService } from "../services/enrollment.service";
import { prisma } from "../../../config/db";

export const validateEligibility = async (req: Request, res: Response) => {
  try {
    const { studentId, courseId } = req.params;
    const isEligible = await EnrollmentService.validateEligibility(Number(studentId), Number(courseId));
    res.status(200).json({ success: true, eligible: isEligible });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /academic/enrollment/students
 * Returns a lightweight list of all active students for dropdowns
 * (e.g. the "Link to Student" picker in Parent Management).
 */
export const getStudentsList = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.students.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        reg_no: true,
        walkin_reg_no: true,
      },
      orderBy: { id: "desc" },
      take: 1000,
    });

    const data = rows.map((s) => ({
      id: s.id,
      name: [s.first_name, s.middle_name, s.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || `Student #${s.id}`,
      reg_no: s.reg_no || s.walkin_reg_no || "",
    }));

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};