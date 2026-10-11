import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

/** Passport-size student photo — Student Enrollment only. */
export const SE_PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;
export const SE_PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "..", "uploads");
const DEST = path.join(UPLOAD_ROOT, "student-enrollment-photos");

const sanitize = (name: string): string => {
  const ext = path.extname(name).toLowerCase();
  const safeExt = ext === ".png" ? ".png" : ".jpg";
  const base = path
    .basename(name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 40);
  return `${base || "student_photo"}${safeExt}`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(DEST, { recursive: true });
    cb(null, DEST);
  },
  filename: (_req, file, cb) => {
    cb(
      null,
      `${Date.now()}_${Math.round(Math.random() * 1e9)}_${sanitize(file.originalname)}`
    );
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!SE_PHOTO_ALLOWED_TYPES.includes(file.mimetype as (typeof SE_PHOTO_ALLOWED_TYPES)[number])) {
    const err = Object.assign(
      new Error("Only JPG/JPEG and PNG images are allowed for the student photo."),
      { statusCode: 400 }
    );
    return cb(err);
  }
  cb(null, true);
};

export const studentEnrollmentPhotoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: SE_PHOTO_MAX_BYTES },
});

export const toStudentPhotoPublicPath = (filename: string): string =>
  `/uploads/student-enrollment-photos/${filename}`;

export const unlinkStudentPhotoFile = (absoluteOrPublicPath?: string | null) => {
  if (!absoluteOrPublicPath) return;
  try {
    if (absoluteOrPublicPath.startsWith("/uploads/")) {
      const abs = path.join(
        UPLOAD_ROOT,
        absoluteOrPublicPath.replace(/^\/uploads[\\/]/, "")
      );
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
      return;
    }
    if (fs.existsSync(absoluteOrPublicPath)) fs.unlinkSync(absoluteOrPublicPath);
  } catch {
    /* best-effort cleanup */
  }
};
