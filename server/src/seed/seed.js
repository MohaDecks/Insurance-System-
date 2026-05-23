import "../config/env.js";
import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Currency } from "../models/Currency.js";
import { InsuranceType } from "../models/InsuranceType.js";
import { VehicleType } from "../models/VehicleType.js";
import { Settings, SETTINGS_KEYS } from "../models/Settings.js";
import { PERMISSION_KEYS } from "../constants/permissions.js";

async function run() {
  await connectDb();
  const { Payment } = await import("../models/Payment.js");
  const { Customer } = await import("../models/Customer.js");
  await Payment.deleteMany({});
  await Customer.deleteMany({});
  await User.deleteMany({});
  await Role.deleteMany({});
  await Permission.deleteMany({});
  await InsuranceType.deleteMany({});
  await VehicleType.deleteMany({});
  await Currency.deleteMany({});
  await Settings.deleteMany({});

  const permDocs = await Permission.insertMany(
    PERMISSION_KEYS.map((key) => ({
      key,
      description: key,
    }))
  );
  const byKey = Object.fromEntries(permDocs.map((p) => [p.key, p._id]));

  const allPermIds = permDocs.map((p) => p._id);
  const adminRole = await Role.create({
    name: "Admin",
    description: "Full access",
    permissions: allPermIds,
  });

  const managerPermKeys = [
    "dashboard:read",
    "customers:create",
    "customers:read",
    "customers:update",
    "insurance_types:read",
    "vehicle_types:read",
    "currencies:read",
    "payments:create",
    "payments:read",
    "payments:update",
    "reports:read",
    "reports:export",
    "notifications:send",
  ];
  const managerRole = await Role.create({
    name: "Manager",
    description: "Operations",
    permissions: managerPermKeys.map((k) => byKey[k]),
  });

  const agentPermKeys = [
    "dashboard:read",
    "customers:create",
    "customers:read",
    "customers:update",
    "insurance_types:read",
    "vehicle_types:read",
    "currencies:read",
    "payments:create",
    "payments:read",
    "reports:read",
  ];
  const agentRole = await Role.create({
    name: "Agent",
    description: "Field agent",
    permissions: agentPermKeys.map((k) => byKey[k]),
  });

  await User.create({
    name: "System Admin",
    email: "admin@insurance.local",
    password: "Admin123!",
    role: adminRole._id,
  });

  await User.create({
    name: "Demo Agent",
    email: "agent@insurance.local",
    password: "Agent123!",
    role: agentRole._id,
  });

  const etb = await Currency.create({ code: "ETB", name: "Ethiopian Birr", symbol: "Br", isDefault: true });
  const usd = await Currency.create({ code: "USD", name: "US Dollar", symbol: "$", isDefault: false });

  await VehicleType.insertMany([
    { name: "Car", sortOrder: 0 },
    { name: "Moto", sortOrder: 10 },
    { name: "Bicycle", sortOrder: 20 },
    { name: "Bajaaj", sortOrder: 25 },
    { name: "Fekon", sortOrder: 26 },
    { name: "Other", sortOrder: 30 },
    { name: "Truck", sortOrder: 40 },
    { name: "Bus", sortOrder: 50 },
    { name: "Trailer", sortOrder: 60 },
  ]);

  await InsuranceType.create({
    name: "Car Daily",
    description: "Motor vehicle comprehensive daily",
    dailyPrice: 120,
    currency: etb._id,
  });
  await InsuranceType.create({
    name: "Moto Daily",
    description: "Motorcycle daily cover",
    dailyPrice: 60,
    currency: etb._id,
  });
  await InsuranceType.create({
    name: "Bicycle Daily",
    description: "Bicycle daily cover",
    dailyPrice: 15,
    currency: etb._id,
  });

  await Settings.insertMany([
    { key: SETTINGS_KEYS.DEFAULT_CURRENCY_CODE, value: "ETB" },
    {
      key: SETTINGS_KEYS.NOTIFICATIONS,
      value: { pushEnabled: false, smsEnabled: false },
    },
    {
      key: SETTINGS_KEYS.PAYMENT_API,
      value: { provider: "", publicKey: "", webhookSecret: "" },
    },
    { key: SETTINGS_KEYS.SMS, value: { provider: "custom", templateId: "" } },
  ]);

  console.log("Seed complete.");
  console.log("Admin: admin@insurance.local / Admin123!");
  console.log("Agent: agent@insurance.local / Agent123!");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
