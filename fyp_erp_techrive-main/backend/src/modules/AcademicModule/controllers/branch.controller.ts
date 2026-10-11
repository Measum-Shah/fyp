import { Request, Response } from "express";
import { BranchService } from "../services/branch.service";

// GET /academic/universities
export const getUniversities = async (req: Request, res: Response) => {
  try {
    const data = await BranchService.getUniversities();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET /academic/universities/:companyId/campuses
export const getCampusesByUniversity = async (req: Request, res: Response) => {
  try {
    const data = await BranchService.getCampusesByUniversity(Number(req.params.companyId));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /academic/branches/:branchId/company
export const assignCampusToUniversity = async (req: Request, res: Response) => {
  try {
    const data = await BranchService.assignCampusToUniversity(Number(req.params.branchId), Number(req.body.company_id));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /academic/branches?institution_type=university
export const getBranches = async (req: Request, res: Response) => {
  try {
    const data = await BranchService.getBranches(req.query.institution_type as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /academic/branches/:branchId/departments
export const getDepartmentsByBranch = async (req: Request, res: Response) => {
  try {
    const data = await BranchService.getDepartmentsByBranch(
      Number(req.params.branchId),
      req.query.institution_type as string
    );
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /academic/branches/assign-department
export const assignDepartmentToBranch = async (req: Request, res: Response) => {
  try {
    const { branch_id, department_id } = req.body;
    const result = await BranchService.assignDepartmentToBranch(Number(branch_id), Number(department_id));
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /academic/branches/remove-department
export const removeDepartmentFromBranch = async (req: Request, res: Response) => {
  try {
    const { branch_id, department_id } = req.body;
    await BranchService.removeDepartmentFromBranch(Number(branch_id), Number(department_id));
    res.status(200).json({ success: true, message: "Removed" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};