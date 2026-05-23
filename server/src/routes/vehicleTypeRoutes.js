import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/vehicleTypeController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("vehicle_types:read"), c.listVehicleTypes);
r.post("/", requirePermission("vehicle_types:create"), c.createVehicleType);
r.patch("/:id", requirePermission("vehicle_types:update"), c.updateVehicleType);
r.delete("/:id", requirePermission("vehicle_types:delete"), c.deleteVehicleType);

export default r;
