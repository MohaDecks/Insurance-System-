import { Settings, SETTINGS_KEYS } from "../models/Settings.js";
import { Currency } from "../models/Currency.js";

const DEFAULTS = {
  [SETTINGS_KEYS.DEFAULT_CURRENCY_CODE]: "ETB",
  [SETTINGS_KEYS.NOTIFICATIONS]: {
    pushEnabled: false,
    smsEnabled: false,
  },
  [SETTINGS_KEYS.PAYMENT_API]: {
    provider: "",
    publicKey: "",
    webhookSecret: "",
  },
  [SETTINGS_KEYS.SMS]: {
    provider: "custom",
    templateId: "",
  },
};

export async function getSettings(req, res, next) {
  try {
    const rows = await Settings.find({});
    const map = { ...DEFAULTS };
    for (const r of rows) {
      map[r.key] = r.value;
    }
    res.json({ success: true, data: map });
  } catch (e) {
    next(e);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const body = req.body || {};
    const allowedKeys = Object.values(SETTINGS_KEYS);
    for (const key of Object.keys(body)) {
      if (!allowedKeys.includes(key)) continue;
      await Settings.findOneAndUpdate(
        { key },
        { key, value: body[key] },
        { upsert: true, new: true }
      );
    }
    if (body[SETTINGS_KEYS.DEFAULT_CURRENCY_CODE]) {
      const code = String(body[SETTINGS_KEYS.DEFAULT_CURRENCY_CODE]).toUpperCase();
      await Currency.updateMany({}, { $set: { isDefault: false } });
      await Currency.findOneAndUpdate({ code }, { $set: { isDefault: true } });
    }
    const rows = await Settings.find({});
    const map = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    res.json({ success: true, data: map });
  } catch (e) {
    next(e);
  }
}
