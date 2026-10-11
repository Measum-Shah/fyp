import { prisma } from "../../../config/db";

export class DashboardService {
  static async getSummaryStats(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where: any = { institution_type };

    const [departments, programs, courses, curriculums, curriculumVersions, lmsMaterials, lmsAssignments] =
      await Promise.all([
        prisma.departments.count({ where: institution_type ? { institution_type } : {} }),
        prisma.programs.count({ where: institution_type ? { institution_type } : {} }),
        prisma.courses.count({ where: institution_type ? { institution_type } : {} }),
        prisma.curriculum.count({ where: institution_type ? { institution_type } : {} }),
        prisma.curriculumVersions.count({ where: institution_type ? { institution_type } : {} }),
        prisma.lmsMaterials.count({ where: institution_type ? { institution_type } : {} }),
        prisma.lmsAssignments.count({ where: institution_type ? { institution_type } : {} }),
      ]);

    return {
      total_departments: departments,
      total_programs: programs,
      total_courses: courses,
      total_curriculums: curriculums,
      total_curriculum_versions: curriculumVersions,
      total_learning_materials: lmsMaterials,
      total_assignments: lmsAssignments,
    };
  }

  static async getCourseDashboardStats(institution_type?: string) {
    if (!institution_type) throw new Error("institution_type is required to prevent data mix-up");
    const where: any = { institution_type };

    const [totalCourses, activeCourses, inactiveCourses] = await Promise.all([
      prisma.courses.count({ where }),
      prisma.courses.count({ where: { ...where, status: "Active" } }),
      prisma.courses.count({ where: { ...where, status: "Inactive" } })
    ]);

    // Grouping queries
    const coursesByCategory = await prisma.courses.groupBy({
      by: ['category'],
      where,
      _count: { id: true }
    });

    const coursesByProgram = await prisma.courses.groupBy({
      by: ['program_id'],
      where,
      _count: { id: true }
    });

    const coursesBySemester = await prisma.courses.groupBy({
      by: ['semester'],
      where,
      _count: { id: true }
    });

    return {
      totalCourses,
      activeCourses,
      inactiveCourses,
      coursesByCategory,
      coursesByProgram,
      coursesBySemester
    };
  }
}