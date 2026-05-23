import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/roleController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("roles:read"), c.listRoles);
r.post("/", requirePermission("roles:create"), c.createRole);
r.patch("/:id", requirePermission("roles:update"), c.updateRole);
r.delete("/:id", requirePermission("roles:delete"), c.deleteRole);

export default r;
