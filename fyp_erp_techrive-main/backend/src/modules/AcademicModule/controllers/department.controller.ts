import { Request, Response } from "express";
import { DepartmentService } from "../services/department.service";

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const dept = await DepartmentService.createDepartment(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error: any) {
    const isValidation = error.message.includes("exists") || error.message.includes("Invalid selection");
    res.status(isValidation ? 400 : 500).json({ success: false, message: error.message });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const branch_id = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const depts = await DepartmentService.getDepartments(institution_type, branch_id);
    res.status(200).json({ success: true, data: depts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const dept = await DepartmentService.getDepartmentById(Number(req.params.id));
    if (!dept) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const dept = await DepartmentService.updateDepartment(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    await DepartmentService.deleteDepartment(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};