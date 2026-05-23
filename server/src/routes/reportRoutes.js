import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import * as c from "../controllers/reportController.js";
import mongoose from "mongoose";
import { Payment } from "../models/Payment.js";
import { startOfUtcDay, parseDateParam } from "../utils/date.js";

const r = Router();
r.use(authenticate);
/** Daily collections report (alias of /daily). */
r.get("/collections", requirePermission("reports:read"), c.dailyReport);
r.get("/daily", requirePermission("reports:read"), c.dailyReport);
r.get("/charts", requirePermission("dashboard:read"), c.chartSeries);
r.get("/export.csv", requirePermission("reports:export"), async (req, res, next) => {
  try {
    const { date, insuranceTypeId, userId } = req.query;
    const d = date ? parseDateParam(date) || new Date(date) : new Date();
    const start = startOfUtcDay(d);
    const payMatch = { forDate: start };
    if (userId && mongoose.isValidObjectId(userId)) {
      payMatch.recordedBy = new mongoose.Types.ObjectId(userId);
    }
    let rows = await Payment.find(payMatch)
      .populate({ path: "customer", select: "fullName phoneNumber insuranceType" })
      .populate("currency", "code")
      .populate("recordedBy", "name email")
      .lean();
    if (insuranceTypeId && mongoose.isValidObjectId(insuranceTypeId)) {
      rows = rows.filter((p) => p.customer?.insuranceType && String(p.customer.insuranceType) === String(insuranceTypeId));
    }
    const header = ["forDate", "customer", "phone", "amount", "currency", "recordedBy", "reference"];
    const lines = [header.join(",")];
    for (const p of rows) {
      lines.push(
        [
          start.toISOString(),
          `"${(p.customer?.fullName || "").replace(/"/g, '""')}"`,
          p.customer?.phoneNumber || "",
          p.amount,
          p.currency?.code || "",
          `"${(p.recordedBy?.name || p.recordedBy?.email || "").replace(/"/g, '""')}"`,
          `"${(p.reference || "").replace(/"/g, '""')}"`,
        ].join(",")
      );
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="report-${start.toISOString().slice(0, 10)}.csv"`);
    res.send(lines.join("\n"));
  } catch (e) {
    next(e);
  }
});

export default r;
