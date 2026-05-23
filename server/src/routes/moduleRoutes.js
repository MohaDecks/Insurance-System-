import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { requireSuperEngr } from "../middleware/requireSuperEngr.js";
import * as c from "../controllers/moduleController.js";

const r = Router();
r.use(authenticate);
r.get("/nav", c.getNav);
r.get("/me", c.listMyPages);
r.use(requireSuperEngr);
r.get("/sections", c.listSections);
r.post("/sections", requirePermission("roles:update"), c.registerSection);
r.delete("/sections/:id", requirePermission("roles:update"), c.deleteSection);
r.get("/", requirePermission("roles:read"), c.listModules);
r.post("/", requirePermission("roles:update"), c.registerModule);
r.patch("/:resource", requirePermission("roles:update"), c.updateModule);
r.delete("/:resource", requirePermission("roles:update"), c.deleteModule);

export default r;
