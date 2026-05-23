import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/insuranceTypeController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("insurance_types:read"), c.listInsuranceTypes);
r.post("/", requirePermission("insurance_types:create"), c.createInsuranceType);
r.patch("/:id", requirePermission("insurance_types:update"), c.updateInsuranceType);
r.delete("/:id", requirePermission("insurance_types:delete"), c.deleteInsuranceType);

export default r;
