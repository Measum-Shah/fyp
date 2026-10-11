import { prisma } from "../../../config/db";

export class DepartmentService {
  static async createDepartment(data: any) {
    if (data.branch_id && data.company_id) {
      // Validate that branch belongs to company
      const branch = await prisma.erpBranches.findFirst({
        where: { id: Number(data.branch_id), company_id: Number(data.company_id) }
      });
      if (!branch) {
        throw new Error("Invalid selection: Campus does not belong to the selected University.");
      }
    }

    const payload: any = {
      name: data.name,
      institution_type: data.institution_type || "university",
    };
    if (data.description) payload.description = data.description;
    if (data.branch_id) payload.branch_id = Number(data.branch_id);

    try {
      return await prisma.$transaction(async (tx) => {
        const dept = await tx.departments.create({ data: payload });

        if (data.branch_id) {
          await tx.branchDepartments.create({
            data: { branch_id: Number(data.branch_id), department_id: dept.id },
          });
        }
        return dept;
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error("A department with this name already exists.");
      }
      throw error;
    }
  }

  static async getDepartments(institution_type?: string, branch_id?: number) {
    let where: any = {};
    if (institution_type) where.institution_type = institution_type;

    if (branch_id) {
      const bds = await prisma.branchDepartments.findMany({
        where: { branch_id },
      });
      const deptIds = bds.map((bd: any) => bd.department_id);
      if (!deptIds.length) return [];
      where.id = { in: deptIds };
    }

    const depts = await prisma.departments.findMany({ where, orderBy: { id: "asc" } });

    // Fetch related branch and company info
    const deptIds = depts.map(d => d.id);
    const branchDepts = await prisma.branchDepartments.findMany({
      where: { department_id: { in: deptIds } }
    });
    
    const branchIds = branchDepts.map(bd => bd.branch_id);
    const branches = branchIds.length ? await prisma.erpBranches.findMany({
      where: { id: { in: branchIds } }
    }) : [];

    const companyIds = branches.map(b => b.company_id);
    const companies = companyIds.length ? await prisma.erpCompanies.findMany({
      where: { id: { in: companyIds } }
    }) : [];

    return depts.map((d: any) => {
      const bd = branchDepts.find(b => b.department_id === d.id);
      const branch = bd ? branches.find(b => b.id === bd.branch_id) : null;
      const company = branch ? companies.find(c => c.id === branch.company_id) : null;
      
      return {
        ...d,
        branch_id: branch?.id,
        campus_name: branch?.name,
        company_id: company?.id,
        university_name: company?.name
      };
    });
  }

  static async getDepartmentById(id: number) {
    return await prisma.departments.findUnique({ where: { id } });
  }

  static async updateDepartment(id: number, data: any) {
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.institution_type !== undefined) updatePayload.institution_type = data.institution_type;
    return await prisma.departments.update({ where: { id }, data: updatePayload });
  }

  static async deleteDepartment(id: number) {
    return await prisma.departments.delete({ where: { id } });
  }
}