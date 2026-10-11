import { prisma } from "../../../config/db";

export class PrerequisiteService {
  static async assignRequisite(data: {
    course_id: number;
    precourse_id: number;
    co_requisite_type?: string;
    min_grade?: string;
  }) {
    if (data.course_id === data.precourse_id)
      throw new Error("Self-reference not allowed");

    const type = data.co_requisite_type || "prerequisite";

    const duplicate = await prisma.prerequisite.findFirst({
      where: { course_id: data.course_id, precourse_id: data.precourse_id, co_requisite_type: type },
    });
    if (duplicate) throw new Error("This requisite relationship already exists");

    const circular = await prisma.prerequisite.findFirst({
      where: { course_id: data.precourse_id, precourse_id: data.course_id, co_requisite_type: type },
    });
    if (circular) throw new Error("Circular dependency detected");

    const created = await prisma.prerequisite.create({
      data: {
        course_id:        data.course_id,
        precourse_id:     data.precourse_id,
        co_requisite_type:type,
        min_grade:        data.min_grade || "C",
      },
    });
    return (await PrerequisiteService._enrichWithCourseCodes([created]))[0];
  }

  static async removeRequisite(id: number) {
    return await prisma.prerequisite.delete({ where: { id } });
  }

  static async getRequisiteChain(course_id: number, type = "prerequisite") {
    const rows = await prisma.prerequisite.findMany({
      where: { course_id, co_requisite_type: type },
    });
    return PrerequisiteService._enrichWithCourseCodes(rows);
  }

  static async getAllRequisites(type = "prerequisite", institution_type?: string) {
    const rows = await prisma.prerequisite.findMany({
      where: { co_requisite_type: type },
      orderBy: { id: "asc" },
    });
    return PrerequisiteService._enrichWithCourseCodes(rows);
  }

  // Batch-load course codes so prerequisites never show "ID-xxx"
  private static async _enrichWithCourseCodes(rows: any[]) {
    if (!rows.length) return rows;

    // Collect all unique course IDs (both course_id and precourse_id)
    const allIds = [...new Set([
      ...rows.map((r: any) => r.course_id).filter(Boolean),
      ...rows.map((r: any) => r.precourse_id).filter(Boolean),
    ])] as number[];

    const courses = allIds.length
      ? await prisma.courses.findMany({
          where: { id: { in: allIds } },
          select: { id: true, name: true, subject_code: true },
        })
      : [];

    const courseMap = Object.fromEntries(
      courses.map((c: any) => [c.id, { code: c.subject_code || `ID-${c.id}`, title: c.name || "" }])
    );

    return rows.map((r: any) => ({
      ...r,
      course_code:       r.course_id    ? (courseMap[r.course_id]?.code    || `ID-${r.course_id}`)    : null,
      course_title:      r.course_id    ? (courseMap[r.course_id]?.title   || "")                      : null,
      precourse_code:    r.precourse_id ? (courseMap[r.precourse_id]?.code  || `ID-${r.precourse_id}`) : null,
      precourse_title:   r.precourse_id ? (courseMap[r.precourse_id]?.title || "")                      : null,
      prerequisite_code: r.precourse_id ? (courseMap[r.precourse_id]?.code  || `ID-${r.precourse_id}`) : null,
      prerequisite_title:r.precourse_id ? (courseMap[r.precourse_id]?.title || "")                      : null,
    }));
  }
}