import { Settings } from "../models/Settings.js";
import { SETTINGS_KEYS } from "../models/Settings.js";

function buildPayload(customer, context) {
  return {
    to: customer.phoneNumber,
    message: `Insurance payment overdue for ${customer.fullName}. Please pay your daily fee.`,
    customerId: String(customer._id),
    ...context,
  };
}

/**
 * Send a single-channel reminder (SMS or push). Respects Settings toggles;
 * if disabled or URL missing, runs a dev stub and still returns ok for UX.
 */
export async function sendReminderForChannel(customer, context = {}, channel) {
  const smsRow = await Settings.findOne({ key: SETTINGS_KEYS.SMS });
  const notifRow = await Settings.findOne({ key: SETTINGS_KEYS.NOTIFICATIONS });
  const smsConfig = smsRow?.value || {};
  const notif = notifRow?.value || { pushEnabled: false, smsEnabled: false };
  const payload = buildPayload(customer, context);
  const result = { channel, ok: true, stub: false, detail: "" };

  if (channel === "sms") {
    if (notif.smsEnabled && process.env.SMS_API_URL) {
      try {
        const res = await fetch(process.env.SMS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.SMS_API_KEY ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` } : {}),
          },
          body: JSON.stringify({ ...payload, ...smsConfig }),
        });
        result.detail = `SMS API HTTP ${res.status}`;
        if (!res.ok) result.stub = true;
      } catch (e) {
        result.stub = true;
        result.detail = e.message;
      }
    } else {
      result.stub = true;
      result.detail = notif.smsEnabled ? "SMS_API_URL not set (stub)" : "SMS disabled in Settings (stub)";
      console.log("[SMS stub]", payload.message, "→", customer.phoneNumber);
    }
    return result;
  }

  if (channel === "push") {
    if (notif.pushEnabled) {
      result.detail = "Push dispatch (stub — configure web push keys)";
      console.log("[Push stub] Unpaid alert for", customer.fullName);
    } else {
      result.stub = true;
      result.detail = "Push disabled in Settings (stub log)";
      console.log("[Push stub/off]", customer.fullName);
    }
    return result;
  }

  return { channel, ok: false, stub: true, detail: "Unknown channel" };
}

/**
 * Legacy: both channels according to settings (bulk job).
 */
export async function notifyUnpaidCustomer(customer, context = {}) {
  const sms = await sendReminderForChannel(customer, context, "sms");
  const push = await sendReminderForChannel(customer, context, "push");
  return { ok: true, sms, push };
}
