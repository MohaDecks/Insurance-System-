import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root folder for uploaded files (served at /uploads/...) */
export const UPLOAD_ROOT = path.join(__dirname, "../../uploads");

export function customerUploadDir(customerId) {
  return path.join(UPLOAD_ROOT, "customers", String(customerId));
}
