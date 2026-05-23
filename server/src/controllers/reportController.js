import { Payment } from "../models/Payment.js";
import { Customer } from "../models/Customer.js";
import { startOfUtcDay, parseDateParam } from "../utils/date.js";
import mongoose from "mongoose";

function dayRange(dateInput) {
  const d = dateInput ? parseDateParam(dateInput) || new Date(dateInput) : new Date();
  const start = startOfUtcDay(d);
  return { start };
}

export async function dailyReport(req, res, next) {
  try {
    const { date, insuranceTypeId, userId } = req.query;
    const { start } = dayRange(date);

    const payMatch = { forDate: start };
    if (userId && mongoose.isValidObjectId(userId)) {
      payMatch.recordedBy = new mongoose.Types.ObjectId(userId);
    }

    const payments = await Payment.find(payMatch)
      .populate("currency", "code symbol")
      .populate("recordedBy", "name email")
      .populate({
        path: "customer",
        select: "fullName insuranceType paymentStatus phoneNumber",
        populate: { path: "insuranceType", select: "name" },
      });

    let filtered = payments;
    if (insuranceTypeId && mongoose.isValidObjectId(insuranceTypeId)) {
      filtered = payments.filter(
        (p) => p.customer?.insuranceType && String(p.customer.insuranceType._id) === insuranceTypeId
      );
    }

    const totalsByCurrency = {};
    for (const p of filtered) {
      const code = p.currency?.code || "UNK";
      if (!totalsByCurrency[code]) totalsByCurrency[code] = { amount: 0, symbol: p.currency?.symbol || "" };
      totalsByCurrency[code].amount += p.amount;
    }

    const customerFilter = {};
    if (insuranceTypeId && mongoose.isValidObjectId(insuranceTypeId)) {
      customerFilter.insuranceType = insuranceTypeId;
    }
    if (userId && mongoose.isValidObjectId(userId)) {
      customerFilter.createdBy = userId;
    }

    /** Customers with payment this day (respecting insurance filter on customer) */
    const allCustomers = await Customer.find(customerFilter).select("_id");
    const paidMatch = { forDate: start };
    if (userId && mongoose.isValidObjectId(userId)) {
      paidMatch.recordedBy = new mongoose.Types.ObjectId(userId);
    }
    const paidForDay = await Payment.find(paidMatch).distinct("customer");
    const paidSet = new Set(paidForDay.map(String));

    let paidCustomers = 0;
    let unpaidCustomers = 0;
    for (const c of allCustomers) {
      if (paidSet.has(String(c._id))) paidCustomers += 1;
      else unpaidCustomers += 1;
    }

    res.json({
      success: true,
      date: start.toISOString(),
      filters: { insuranceTypeId: insuranceTypeId || null, userId: userId || null },
      paymentsCollected: filtered,
      totalsByCurrency,
      counts: {
        paidCustomers,
        unpaidCustomers,
        totalCustomers: allCustomers.length,
        paymentRecords: filtered.length,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function chartSeries(req, res, next) {
  try {
    const { days = 14 } = req.query;
    const n = Math.min(90, Math.max(1, Number(days) || 14));
    const today = startOfUtcDay();
    const incomeSeries = [];
    for (let i = n - 1; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setUTCDate(day.getUTCDate() - i);
      const start = startOfUtcDay(day);
      const agg = await Payment.aggregate([
        { $match: { forDate: start } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      incomeSeries.push({
        date: start.toISOString(),
        income: agg[0]?.total || 0,
      });
    }

    const unpaidSeries = await Promise.all(
      incomeSeries.map(async ({ date }) => {
        const d = startOfUtcDay(new Date(date));
        const paidIds = await Payment.distinct("customer", { forDate: d });
        const total = await Customer.countDocuments({});
        return { date, unpaid: Math.max(0, total - paidIds.length) };
      })
    );

    res.json({ success: true, incomeSeries, unpaidSeries });
  } catch (e) {
    next(e);
  }
}
