import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/fee.helpers";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "..", "uploads");

const sanitize = (name: string): string => {
  const ext = path.extname(name);
  const base = path
    .basename(name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  return `${base || "receipt"}${ext}`;
};

const dest = path.join(UPLOAD_ROOT, "fee-receipts");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}_${sanitize(file.originalname)}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new AppError("Only image files are allowed (JPG, PNG, WEBP)", 400));
  }
  cb(null, true);
};

export const feeReceiptUpload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

export const toReceiptPublicPath = (filename: string): string =>
  `/uploads/fee-receipts/${filename}`;
