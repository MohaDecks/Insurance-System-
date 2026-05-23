import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);

export const SETTINGS_KEYS = {
  DEFAULT_CURRENCY_CODE: "default_currency_code",
  NOTIFICATIONS: "notifications",
  PAYMENT_API: "payment_api",
  SMS: "sms_provider",
  CUSTOM_NAV_MODULES: "custom_nav_modules",
  REGISTERED_PAGES: "registered_pages",
  SIDEBAR_SECTIONS: "sidebar_sections",
};
