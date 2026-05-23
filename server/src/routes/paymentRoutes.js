import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/paymentController.js";

const r = Router();
r.use(authenticate);
/** Unpaid list for a UTC day (alias of /unpaid-daily). */
r.get("/unpaid", requirePermission("payments:read"), c.listUnpaidDaily);
r.get("/unpaid-daily", requirePermission("payments:read"), c.listUnpaidDaily);
/** Paid / ledger list (alias of GET /). */
r.get("/paid", requirePermission("payments:read"), c.listPayments);
r.post("/remind", requirePermission("notifications:send"), c.remindUnpaidOne);
r.get("/", requirePermission("payments:read"), c.listPayments);
r.post("/", requirePermission("payments:create"), c.createPayment);
r.patch("/:id", requirePermission("payments:update"), c.updatePayment);
r.delete("/:id", requirePermission("payments:delete"), c.deletePayment);

export default r;
