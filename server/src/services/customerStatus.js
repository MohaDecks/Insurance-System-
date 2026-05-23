import { Customer } from "../models/Customer.js";
import { Payment } from "../models/Payment.js";
import { InsuranceType } from "../models/InsuranceType.js";
import { startOfUtcDay } from "../utils/date.js";

export async function hasPaymentForDay(customerId, day = new Date()) {
  const start = startOfUtcDay(day);
  const p = await Payment.findOne({ customer: customerId, forDate: start });
  return !!p;
}

/** Updates cached paymentStatus on customer for `day` */
export async function refreshCustomerStatus(customerId, day = new Date()) {
  const start = startOfUtcDay(day);
  const paid = await hasPaymentForDay(customerId, day);
  await Customer.findByIdAndUpdate(customerId, {
    paymentStatus: paid ? "PAID" : "UNPAID",
    lastStatusDate: start,
  });
  return paid ? "PAID" : "UNPAID";
}

export async function refreshAllCustomersForDay(day = new Date()) {
  const customers = await Customer.find({}).select("_id");
  for (const c of customers) {
    await refreshCustomerStatus(c._id, day);
  }
}
