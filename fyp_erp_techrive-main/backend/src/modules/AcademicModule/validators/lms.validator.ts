import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().optional(),
  material_type: z.string().optional(),
  file_url: z.string().optional(),
  file_size: z.string().optional(),
  description: z.string().optional(),
  uploaded_by_name: z.string().optional(),
  course_id: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  module_id: z.number().optional().or(z.string().regex(/^\d+$/).transform(Number).optional()),
  institution_type: z.string().optional()
});

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/)), // Accept ISO date strings
  max_score: z.number().or(z.string().regex(/^\d+$/).transform(Number)).optional(),
  submission_type: z.enum(["file", "text", "file+text"]).optional(),
  status: z.string().optional(),
  course_id: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  institution_type: z.string().optional()
});

const submissionSchema = z.object({
  assignment_id: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  submission_text: z.string().optional(),
  file_url: z.string().optional()
});

const gradeSchema = z.object({
  grade: z.number().or(z.string().regex(/^\d+$/).transform(Number)),
  feedback: z.string().optional()
});

const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues
        });
      }
      next(error);
    }
  };
};

export const validateMaterial = validate(materialSchema);
export const validateAssignment = validate(assignmentSchema);
export const validateSubmission = validate(submissionSchema);
export const validateGrade = validate(gradeSchema);
