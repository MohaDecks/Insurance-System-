import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { makeIdDocumentUploader } from "../middleware/uploadIdDocument.js";
import * as c from "../controllers/customerController.js";

const uploadId = makeIdDocumentUploader();

const r = Router();
r.use(authenticate);
r.get("/sync-statuses", requirePermission("customers:read"), c.syncStatuses);
r.get("/", requirePermission("customers:read"), c.listCustomers);
r.post(
  "/:id/id-documents",
  requirePermission("customers:update"),
  uploadId.single("file"),
  c.addIdDocument
);
r.delete("/:id/id-documents/:fileId", requirePermission("customers:update"), c.removeIdDocument);
r.get("/:id", requirePermission("customers:read"), c.getCustomer);
r.post("/", requirePermission("customers:create"), c.createCustomer);
r.patch("/:id", requirePermission("customers:update"), c.updateCustomer);
r.delete("/:id", requirePermission("customers:delete"), c.deleteCustomer);

export default r;
