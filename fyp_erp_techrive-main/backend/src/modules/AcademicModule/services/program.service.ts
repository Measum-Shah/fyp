import { prisma } from "../../../config/db";

export class ProgramService {
  static async createProgram(data: any) {
    // Map frontend fields (title, degree_level, duration_years, total_credits, department_id)
    // to the actual Programs table columns (name, description, years, status, institution_type, code)
    const payload: any = {
      name: data.title || data.name,
      description: data.description || "",
      years: data.duration_years || data.years || 1,
      tier_id: data.tier_id || 0,
      code: data.code || null,
      status: data.status === "active" || data.status === 1 ? 1 : 0,
      institution_type: data.institution_type || "university",
    };

    // Optional fields — only add if present to avoid Prisma undefined errors
    if (data.start_month) payload.start_month = data.start_month;
    if (data.end_month) payload.end_month = data.end_month;
    if (data.duration) payload.duration = Number(data.duration);
    if (data.branch_id) payload.branch_id = Number(data.branch_id);

    return await prisma.programs.create({ data: payload });
  }

  static async getPrograms(institution_type?: string, branch_id?: number) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;
    if (branch_id) where.branch_id = branch_id;
    return await prisma.programs.findMany({ where, orderBy: { id: "asc" } });
  }

  static async getProgramById(id: number) {
    return await prisma.programs.findUnique({ where: { id } });
  }

  static async updateProgram(id: number, data: any) {
    // Allow both old-style (name/years) and new-style (title/duration_years) fields
    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.name = data.title;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.duration_years !== undefined) updatePayload.years = Number(data.duration_years);
    if (data.years !== undefined) updatePayload.years = Number(data.years);
    if (data.status !== undefined) {
      updatePayload.status = data.status === "active" || data.status === 1 ? 1 : 0;
    }
    if (data.institution_type !== undefined) updatePayload.institution_type = data.institution_type;
    
    // Optional fields
    if (data.start_month !== undefined) updatePayload.start_month = data.start_month;
    if (data.end_month !== undefined) updatePayload.end_month = data.end_month;
    if (data.duration !== undefined) updatePayload.duration = Number(data.duration);
    if (data.branch_id !== undefined) updatePayload.branch_id = Number(data.branch_id) || null;

    return await prisma.programs.update({ where: { id }, data: updatePayload });
  }

  static async deleteProgram(id: number) {
    return await prisma.programs.delete({ where: { id } });
  }
}
