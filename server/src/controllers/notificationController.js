import { Customer } from "../models/Customer.js";
import { notifyUnpaidCustomer } from "../services/notificationService.js";
import { startOfUtcDay, parseDateParam } from "../utils/date.js";
import { refreshAllCustomersForDay } from "../services/customerStatus.js";

export async function remindUnpaid(req, res, next) {
  try {
    const { date } = req.query;
    const day = date ? startOfUtcDay(parseDateParam(date) || new Date(date)) : startOfUtcDay();
    await refreshAllCustomersForDay(day);

    const unpaid = await Customer.find({ paymentStatus: "UNPAID" });
    const results = [];
    for (const c of unpaid) {
      const r = await notifyUnpaidCustomer(c, { forDate: day.toISOString() });
      results.push({ customerId: c._id, ...r });
    }
    res.json({
      success: true,
      date: day.toISOString(),
      notified: results.length,
      results,
    });
  } catch (e) {
    next(e);
  }
}
