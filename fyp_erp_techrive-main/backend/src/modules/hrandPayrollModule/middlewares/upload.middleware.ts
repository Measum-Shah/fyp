import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/app-error";

// ─── createUploader ──────────────────────────────────────────────────────────
// Generic disk-storage multer factory, scoped to the HR & Payroll module
// (kept local here rather than in the shared `src/middlewares` folder, since
// only files inside `hrandPayrollModule` may be added/changed at this time —
// same convention `validate.middleware.ts` already follows).
//
// Used by Staff Qualifications ("attachment" — degree/certificate scans) and
// Staff Assets ("attachment" — proof-of-issue photos/receipts). Every upload
// lands in backend/uploads/<subdir>/, and is served back out at the public
// path returned by the controller (see index.ts's `app.use("/uploads", ...)`
// static mount), e.g. "/uploads/staff-qualifications/12_1719999999999_degree.pdf".
//
// Usage:
//   const staffQualificationUpload = createUploader("staff-qualifications");
//   router.post("/upload-attachment", staffQualificationUpload.single("file"), uploadStaffQualificationAttachment);

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// backend/uploads/<subdir> — resolved relative to this file so it works the
// same whether running via `tsx` (from src/) or the compiled `dist/` output.
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "..", "uploads");

const sanitizeFilename = (originalName: string): string => {
  const ext = path.extname(originalName);
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
};

export const createUploader = (subdir: string) => {
  const destination = path.join(UPLOAD_ROOT, subdir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req: Request, file, cb) => {
      // NOTE: req.body isn't guaranteed to be populated yet at this point in
      // the multipart stream (depends on field order), so uniqueness is
      // derived from timestamp + a short random suffix instead of staff_id.
      const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${sanitizeFilename(file.originalname)}`;
      cb(null, unique);
    },
  });

  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        AppError.badRequest(
          "Unsupported file type. Allowed formats: PDF, DOC, DOCX, JPG, PNG, WEBP"
        )
      );
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
};

export const toPublicUploadPath = (subdir: string, filename: string): string =>
  `/uploads/${subdir}/${filename}`;