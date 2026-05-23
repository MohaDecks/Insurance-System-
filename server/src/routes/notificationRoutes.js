import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/notificationController.js";

const r = Router();
r.use(authenticate);
r.post("/remind-unpaid", requirePermission("notifications:send"), c.remindUnpaid);

export default r;
