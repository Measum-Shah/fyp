import { prisma } from "../../../config/db";

export class CurriculumVersionService {
  static async createVersion(data: any) {
    return await prisma.curriculumVersions.create({ data });
  }
  static async getVersions(institution_type?: string) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;
    return await prisma.curriculumVersions.findMany({ where, orderBy: { id: "asc" } });
  }
  static async getVersionById(id: number) {
    return await prisma.curriculumVersions.findUnique({ where: { id } });
  }
  static async updateVersion(id: number, data: any) {
    return await prisma.curriculumVersions.update({ where: { id }, data });
  }
  static async deleteVersion(id: number) {
    return await prisma.curriculumVersions.delete({ where: { id } });
  }
}