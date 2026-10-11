import { Request, Response } from "express";
import { fineService } from "../services/fine.service";
import { prisma } from "../../../config/db";

const FineStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  WAIVED: 'WAIVED'
} as const;
type FineStatus = (typeof FineStatus)[keyof typeof FineStatus];

export const getFines = async (req: Request, res: Response) => {
  try {
    const fines = await fineService.getFines(req.query);
    res.json(fines);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fine = await fineService.getFineById(Number(id));
    const fineJson = JSON.parse(JSON.stringify(fine, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(fineJson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await fineService.getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCategoriesAdmin = async (req: Request, res: Response) => {
  try {
    const categories = await fineService.getAllCategoriesAdmin();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await fineService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await fineService.updateCategory(Number(id), req.body);
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFine = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const fine = await fineService.createFine({
      ...req.body,
      issuedById: BigInt(userId)
    });
    const fineJson = JSON.parse(JSON.stringify(fine, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    res.status(201).json(fineJson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateFineStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const { id } = req.params;
    const { status, details } = req.body;
    
    if (!Object.values(FineStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const fine = await fineService.updateFineStatus(Number(id), status as FineStatus, BigInt(userId), details);
    const fineJson = JSON.parse(JSON.stringify(fine, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(fineJson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const { id } = req.params;
    
    const result = await fineService.recordPayment(Number(id), {
      ...req.body,
      recordedById: BigInt(userId)
    });

    const resultJson = JSON.parse(JSON.stringify(result, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(resultJson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Student Portal Endpoints
export const getStudentFines = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const student = await prisma.students.findFirst({
      where: { user_id: Number(userId) }
    });
    
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }
    
    const fines = await fineService.getFines({ studentId: student.id });
    res.json(fines);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentFineById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const student = await prisma.students.findFirst({
      where: { user_id: Number(userId) }
    });
    
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const { id } = req.params;
    const fine = await fineService.getFineById(Number(id));
    
    if (fine.studentId !== student.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const fineJson = JSON.parse(JSON.stringify(fine, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    res.json(fineJson);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
