import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/settingsController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("settings:read"), c.getSettings);
r.put("/", requirePermission("settings:update"), c.updateSettings);

export default r;
