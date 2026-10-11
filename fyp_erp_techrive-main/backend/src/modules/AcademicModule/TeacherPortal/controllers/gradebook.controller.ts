import { Request, Response } from "express";
import { GradebookService } from "../services/gradebook.service";
import { getAuthUser } from "../../../../utils/authHelper";

export class GradebookController {
  
  static async getCategories(req: Request, res: Response) {
    try {
      const courseId = Number(req.params.courseId);
      const sectionId = Number(req.params.sectionId);
      const categories = await GradebookService.getCategories(courseId, sectionId);
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveCategory(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });
      
      const category = await GradebookService.saveCategory(req.body, staffId);
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const result = await GradebookService.deleteCategory(categoryId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async publishGradebook(req: Request, res: Response) {
    try {
      const { courseId, sectionId, isPublished } = req.body;
      const result = await GradebookService.publishGradebook(courseId, sectionId, isPublished);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getMarks(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const sectionId = Number(req.params.sectionId);
      const marks = await GradebookService.getMarks(categoryId, sectionId);
      res.json({ success: true, data: marks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveMarks(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const { marks } = req.body;
      const result = await GradebookService.saveMarks(categoryId, marks);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSummary(req: Request, res: Response) {
    try {
      const courseId = Number(req.params.courseId);
      const sectionId = Number(req.params.sectionId);
      const summary = await GradebookService.getSummary(courseId, sectionId);
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
