import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/permissionController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("roles:read"), c.listPermissions);

export default r;
