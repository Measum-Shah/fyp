import { Request, Response } from "express";
import { CourseService } from "../services/course.service";

export const createCourse = async (req: Request, res: Response) => {
  try {
    const data = await CourseService.createCourse(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCourses = async (req: Request, res: Response) => {
  try {
    const data = await CourseService.getCourses(req.query);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const data = await CourseService.getCourseById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const data = await CourseService.updateCourse(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    await CourseService.deleteCourse(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};