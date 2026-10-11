import { prisma } from "../../../config/db";

export class ReportService {
  static async getCourseCatalogReport(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where = { institution_type };
    return await prisma.courses.findMany({ where, orderBy: { id: "asc" } });
  }

  static async getDepartmentWiseCourseList(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where = { institution_type };
    return await prisma.courses.groupBy({
      by: ['program_id'],
      where,
      _count: { id: true }
    });
  }

  static async getProgramWiseCourseList(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where = { institution_type };
    return await prisma.courses.groupBy({
      by: ['program_id'],
      where,
      _count: { id: true }
    });
  }

  static async getSemesterWiseCourseList(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where = { institution_type };
    return await prisma.courses.groupBy({
      by: ['semester'],
      where,
      _count: { id: true }
    });
  }

  static async getCreditHourReport(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where = { institution_type };
    return await prisma.courses.groupBy({
      by: ['number'], // credit_hours changed to number
      where,
      _count: { id: true }
    });
  }

  static async getPrerequisiteReport(course_id?: number) {
    const where: any = { co_requisite_type: "prerequisite" };
    if (course_id) where.course_id = course_id;
    return await prisma.prerequisite.findMany({ where });
  }

  static async getCorequisiteReport(course_id?: number) {
    const where: any = { co_requisite_type: "corequisite" };
    if (course_id) where.course_id = course_id;
    return await prisma.prerequisite.findMany({ where });
  }
}