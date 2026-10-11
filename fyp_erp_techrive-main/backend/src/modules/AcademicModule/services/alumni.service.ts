import { prisma } from "../../../config/db";

export class AlumniService {
  static async getAlumniDirectory(branch_id?: number) {
    const whereClause: any = {
      admission_status: "Alumni"
    };
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    return await prisma.students.findMany({
      where: whereClause,
      // include: {
      //   Programs: true,
      // },
      orderBy: {
        id: "desc"
      }
    });
  }

  static async graduateStudents(studentIds: number[], updatedBy: number) {
    if (!studentIds || studentIds.length === 0) {
      throw new Error("No students selected for graduation.");
    }

    const updatedStudents = await prisma.students.updateMany({
      where: {
        id: { in: studentIds }
      },
      data: {
        admission_status: "Alumni",
      }
    });

    return updatedStudents;
  }

  static async getStudentsInFinalTerm(program_id: number, term_id: number, branch_id?: number) {
    const whereClause: any = {
      program_id,
      term_id,
      admission_status: {
        not: "Alumni"
      }
    };
    
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    return await prisma.students.findMany({
      where: whereClause,
    });
  }
}
