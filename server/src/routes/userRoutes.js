import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/userController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("users:read"), c.listUsers);
r.post("/", requirePermission("users:create"), c.createUser);
r.patch("/:id", requirePermission("users:update"), c.updateUser);
r.delete("/:id", requirePermission("users:delete"), c.deleteUser);

export default r;
