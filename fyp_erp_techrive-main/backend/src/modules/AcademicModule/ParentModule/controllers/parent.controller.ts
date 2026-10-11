import { Request, Response } from "express";
import { ParentService } from "../services/parent.service";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "erp_secret_key";
const JWT_EXPIRES = "24h";

// POST /parent/auth/login
export const parentLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });

    const { user, parentDetail } = await ParentService.loginParent(email, password);

    const token = jwt.sign(
      { id: user.id, user_type: "parent", parent_detail_id: parentDetail.id, student_id: parentDetail.students_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        user_type:  "parent",
        student_id: parentDetail.students_id,
      },
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

// GET /parent/student  — student info
export const getStudentInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = await ParentService.getStudentByParentUserId(userId);
    if (!data) return res.status(404).json({ success: false, message: "Student not found" });
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /parent/student/courses
export const getStudentCourses = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.student_id || req.params.studentId);
    const data = await ParentService.getStudentCourses(studentId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /parent/student/results
export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.student_id || req.params.studentId);
    const data = await ParentService.getStudentResults(studentId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /parent/student/progress
export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.student_id || req.params.studentId);
    const data = await ParentService.getStudentProgress(studentId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /parent/student/teachers
export const getStudentTeachers = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.student_id || req.params.studentId);
    const data = await ParentService.getStudentTeachers(studentId);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /parent/admin/create-credentials (admin only)
export const createParentCredentials = async (req: Request, res: Response) => {
  try {
    const { parent_detail_id, email, password } = req.body;
    if (!parent_detail_id || !email || !password)
      return res.status(400).json({ success: false, message: "parent_detail_id, email and password are required" });
    const result = await ParentService.createParentCredentials(Number(parent_detail_id), email, password);
    res.status(201).json({ success: true, data: result, message: "Parent credentials created successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
// GET /parent/admin/parents — list all parents
export const getAllParents = async (req: Request, res: Response) => {
  try {
    const data = await ParentService.getAllParents();
    res.status(200).json({ success: true, data });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /parent/admin/parents — create parent record
export const createParent = async (req: Request, res: Response) => {
  try {
    const data = await ParentService.createParent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

// DELETE /parent/admin/parents/:id — delete parent
export const deleteParent = async (req: Request, res: Response) => {
  try {
    await ParentService.deleteParent(Number(req.params.id));
    res.status(200).json({ success: true, message: "Parent deleted" });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

// PATCH /parent/admin/parents/:id — update parent record
export const updateParent = async (req: Request, res: Response) => {
  try {
    const data = await ParentService.updateParent(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};