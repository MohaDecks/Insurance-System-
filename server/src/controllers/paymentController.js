import { Payment } from "../models/Payment.js";
import { Customer } from "../models/Customer.js";
import { HttpError } from "../middleware/errorHandler.js";
import { refreshCustomerStatus } from "../services/customerStatus.js";
import { startOfUtcDay, parseDateParam } from "../utils/date.js";
import { sendReminderForChannel } from "../services/notificationService.js";

/** Customers with no payment for the given UTC calendar day */
export async function listUnpaidDaily(req, res, next) {
  try {
    const { date, search, page = 1, limit = 25 } = req.query;
    const day = date ? startOfUtcDay(parseDateParam(date) || new Date(date)) : startOfUtcDay();
    const paidIds = await Payment.find({ forDate: day }).distinct("customer");
    const q = { _id: { $nin: paidIds } };
    if (search && String(search).trim()) {
      const rx = new RegExp(String(search).trim(), "i");
      q.$or = [{ fullName: rx }, { phoneNumber: rx }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Customer.find(q)
        .populate("vehicleType", "name sortOrder")
        .populate("insuranceType", "name dailyPrice")
        .populate("currency", "code symbol")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(q),
    ]);
    res.json({
      success: true,
      forDate: day.toISOString(),
      data: items,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    next(e);
  }
}

/** One-off SMS or push for unpaid day */
export async function remindUnpaidOne(req, res, next) {
  try {
    const { customerId, date, channel } = req.body;
    if (!customerId || !channel) {
      throw new HttpError(400, "customerId and channel (sms | push) required");
    }
    if (!["sms", "push"].includes(channel)) {
      throw new HttpError(400, "channel must be sms or push");
    }
    const day = date ? startOfUtcDay(parseDateParam(date) || new Date(date)) : startOfUtcDay();
    const existing = await Payment.findOne({ customer: customerId, forDate: day });
    if (existing) {
      throw new HttpError(400, "Customer already has payment for this day");
    }
    const customer = await Customer.findById(customerId);
    if (!customer) throw new HttpError(404, "Customer not found");
    const out = await sendReminderForChannel(customer, { forDate: day.toISOString() }, channel);
    res.json({ success: true, result: out });
  } catch (e) {
    next(e);
  }
}

export async function listPayments(req, res, next) {
  try {
    const { customerId, from, to, page = 1, limit = 30 } = req.query;
    const q = {};
    if (customerId) q.customer = customerId;
    if (from || to) {
      q.forDate = {};
      if (from) q.forDate.$gte = startOfUtcDay(parseDateParam(from) || new Date(from));
      if (to) q.forDate.$lte = startOfUtcDay(parseDateParam(to) || new Date(to));
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Payment.find(q)
        .populate("customer", "fullName phoneNumber paymentStatus")
        .populate("currency", "code symbol")
        .populate("recordedBy", "name email")
        .sort({ forDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    next(e);
  }
}

export async function createPayment(req, res, next) {
  try {
    const { customerId, amount, currencyId, forDate, reference = "" } = req.body;
    if (!customerId || amount === undefined || !currencyId) {
      throw new HttpError(400, "customerId, amount, currencyId required");
    }
    const customer = await Customer.findById(customerId).populate("insuranceType");
    if (!customer) throw new HttpError(404, "Customer not found");
    const day = forDate ? startOfUtcDay(parseDateParam(forDate) || new Date(forDate)) : startOfUtcDay();
    let payAmount = Number(amount);
    if (Number.isNaN(payAmount) || payAmount < 0) throw new HttpError(400, "Invalid amount");

    const existing = await Payment.findOne({ customer: customerId, forDate: day });
    if (existing) throw new HttpError(409, "Payment already exists for this day");

    const doc = await Payment.create({
      customer: customerId,
      amount: payAmount,
      currency: currencyId,
      forDate: day,
      recordedBy: req.user._id,
      reference,
    });
    await refreshCustomerStatus(customerId, day);
    const out = await Payment.findById(doc._id)
      .populate("customer", "fullName phoneNumber")
      .populate("currency", "code symbol")
      .populate("recordedBy", "name email");
    res.status(201).json({ success: true, data: out });
  } catch (e) {
    if (e.code === 11000) return next(new HttpError(409, "Duplicate payment for day"));
    next(e);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, currencyId, forDate, reference } = req.body;
    const p = await Payment.findById(id);
    if (!p) throw new HttpError(404, "Not found");
    if (amount !== undefined) p.amount = Number(amount);
    if (currencyId !== undefined) p.currency = currencyId;
    if (forDate !== undefined) p.forDate = startOfUtcDay(parseDateParam(forDate) || new Date(forDate));
    if (reference !== undefined) p.reference = reference;
    await p.save();
    await refreshCustomerStatus(p.customer, p.forDate);
    const out = await Payment.findById(p._id)
      .populate("customer", "fullName phoneNumber")
      .populate("currency", "code symbol")
      .populate("recordedBy", "name email");
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function deletePayment(req, res, next) {
  try {
    const { id } = req.params;
    const p = await Payment.findByIdAndDelete(id);
    if (!p) throw new HttpError(404, "Not found");
    await refreshCustomerStatus(p.customer, p.forDate);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
