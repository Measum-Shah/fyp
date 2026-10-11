import { Request, Response } from "express";
import { LmsService } from "../services/lms.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── LMS Materials ────────────────────────────────────────────────────────────

export const uploadMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.uploadMaterial(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("UPLOAD MATERIAL ERROR:", error);
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.updateMaterial(Number(req.params.id), req.body, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("Unauthorized") || error.message.includes("Not found")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    await LmsService.deleteMaterial(Number(req.params.id), req.user);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    if (error.message.includes("Unauthorized") || error.message.includes("Not found")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /lms/materials?institution_type=university
 * Returns all LMS materials filtered by institution_type.
 * This is the fix for the LMS persistence bug.
 */
export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const course_id = req.query.course_id ? Number(req.query.course_id) : undefined;
    const data = await LmsService.getMaterials(institution_type, course_id, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** Legacy route kept for backward compat: GET /lms/materials/module/:moduleId */
export const getMaterialsByModule = async (req: AuthRequest, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await LmsService.getMaterials(institution_type, undefined, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LMS Assignments ─────────────────────────────────────────────────────────

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.createAssignment(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.updateAssignment(Number(req.params.id), req.body, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("Not found")) return res.status(404).json({ success: false, message: error.message });
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    await LmsService.deleteAssignment(Number(req.params.id), req.user);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    if (error.message.includes("Not found")) return res.status(404).json({ success: false, message: error.message });
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await LmsService.getAssignments(institution_type, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.submitAssignment(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("deadline") || error.message.includes("type") || error.message.includes("Unauthorized") || error.message.includes("Not found")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const data = await LmsService.getSubmissions(Number(req.params.assignmentId), req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { grade, feedback } = req.body;
    const data = await LmsService.gradeSubmission(Number(req.params.id), grade, feedback, req.user);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    if (error.message.includes("Not found")) return res.status(404).json({ success: false, message: error.message });
    if (error.message.includes("Unauthorized")) return res.status(403).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};