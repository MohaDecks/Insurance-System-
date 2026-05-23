import fs from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { customerUploadDir } from "../config/uploads.js";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function extFromOriginal(name) {
  const ext = path.extname(name || "").toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : "";
}

export function makeIdDocumentUploader() {
  return multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        try {
          const dir = customerUploadDir(req.params.id);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        } catch (e) {
          cb(e);
        }
      },
      filename(req, file, cb) {
        const ext = extFromOriginal(file.originalname) || ".bin";
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter(req, file, cb) {
      const ext = extFromOriginal(file.originalname);
      if (!ext || !ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error("Only JPG, PNG, WebP, or PDF files are allowed"));
      }
      cb(null, true);
    },
  });
}
