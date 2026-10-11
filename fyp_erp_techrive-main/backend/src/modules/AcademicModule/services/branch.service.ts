import { prisma } from "../../../config/db";

export class BranchService {

  // ── Step 1: Get all Universities ──────────────────────────────────────────
  static async getUniversities() {
    return await prisma.erpCompanies.findMany({
      where: { status: 1 },
      orderBy: { id: "asc" },
      select: { id: true, name: true, description: true, logo: true },
    });
  }

  // ── Step 2: Get campuses for a university ─────────────────────────────────
  static async getCampusesByUniversity(company_id: number) {
    return await prisma.erpBranches.findMany({
      where: { company_id, status: 1 },
      orderBy: { id: "asc" },
      select: { id: true, name: true, branch_code: true, address: true, email: true, phone: true, city_id: true, company_id: true },
    });
  }

  // ── Step 2.5: Assign campus to university ─────────────────────────────────
  static async assignCampusToUniversity(branch_id: number, company_id: number) {
    return await prisma.erpBranches.update({
      where: { id: branch_id },
      data: { company_id },
    });
  }

  // ── Get all branches (campuses) filtered by institution_type ──────────────
  static async getBranches(institution_type?: string) {
    if (institution_type) {
      const depts = await prisma.departments.findMany({
        where: { institution_type },
        select: { id: true },
      });
      const deptIds = depts.map((d: any) => d.id);
      if (!deptIds.length) {
        return await prisma.erpBranches.findMany({ where: { status: 1 }, orderBy: { id: "asc" } });
      }
      const bds = await prisma.branchDepartments.findMany({
        where: { department_id: { in: deptIds } },
        select: { branch_id: true },
      });
      const branchIds = [...new Set(bds.map((bd: any) => bd.branch_id))];
      if (!branchIds.length) {
        return await prisma.erpBranches.findMany({ where: { status: 1 }, orderBy: { id: "asc" } });
      }
      return await prisma.erpBranches.findMany({
        where: { id: { in: branchIds }, status: 1 },
        orderBy: { id: "asc" },
      });
    }
    return await prisma.erpBranches.findMany({ where: { status: 1 }, orderBy: { id: "asc" } });
  }

  // ── Step 3: Get departments for a campus ─────────────────────────────────
  static async getDepartmentsByBranch(branch_id: number, institution_type?: string) {
    const bds = await prisma.branchDepartments.findMany({
      where: { branch_id },
    });
    const deptIds = bds.map((bd: any) => bd.department_id);
    if (!deptIds.length) return [];
    const where: any = { id: { in: deptIds } };
    if (institution_type) where.institution_type = institution_type;
    const depts = await prisma.departments.findMany({ where, orderBy: { id: "asc" } });
    return depts.map((d: any) => ({ ...d, branch_id }));
  }

  // ── Assign department to campus ───────────────────────────────────────────
  static async assignDepartmentToBranch(branch_id: number, department_id: number) {
    const existing = await prisma.branchDepartments.findFirst({
      where: { branch_id, department_id },
    });
    if (existing) throw new Error("Department already assigned to this campus");
    return await prisma.branchDepartments.create({ data: { branch_id, department_id } });
  }

  static async removeDepartmentFromBranch(branch_id: number, department_id: number) {
    return await prisma.branchDepartments.updateMany({
      where: { branch_id, department_id },
      data: { deleted_at: new Date() },
    });
  }
}