import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/currencyController.js";

const r = Router();
r.use(authenticate);
r.get("/", requirePermission("currencies:read"), c.listCurrencies);
r.post("/", requirePermission("currencies:create"), c.createCurrency);
r.patch("/:id", requirePermission("currencies:update"), c.updateCurrency);
r.delete("/:id", requirePermission("currencies:delete"), c.deleteCurrency);

export default r;
