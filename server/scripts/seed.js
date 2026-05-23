/**
 * Wipes the database and inserts fresh demo/live-ready data.
 *
 *   cd server
 *   SEED_CONFIRM=yes npm run seed
 *
 * Optional .env:
 *   SEED_ADMIN_EMAIL=admin@insurance.local
 *   SEED_ADMIN_PASSWORD=ChangeMe123!
 *   SEED_SUPER_EMAIL=deq@gmail.com
 *   SEED_SUPER_PASSWORD=ChangeMe123!
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "../src/config/db.js";
import { Permission } from "../src/models/Permission.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import { Currency } from "../src/models/Currency.js";
import { InsuranceType } from "../src/models/InsuranceType.js";
import { VehicleType } from "../src/models/VehicleType.js";
import { Settings, SETTINGS_KEYS } from "../src/models/Settings.js";
import { INITIAL_PAGES } from "../src/migrations/ensurePageRegistry.js";
import { INITIAL_SIDEBAR_SECTIONS } from "../src/utils/pageSections.js";
import { permissionKeysForResource } from "../src/constants/navModules.js";

const VEHICLE_TYPES = [
  { name: "Car", sortOrder: 0 },
  { name: "Moto", sortOrder: 10 },
  { name: "Bicycle", sortOrder: 20 },
  { name: "Bajaaj", sortOrder: 25 },
  { name: "Fekon", sortOrder: 26 },
  { name: "Other", sortOrder: 30 },
  { name: "Truck", sortOrder: 40 },
  { name: "Bus", sortOrder: 50 },
  { name: "Trailer", sortOrder: 60 },
];

const MANAGER_PERM_KEYS = [
  "dashboard:read",
  "customers:create",
  "customers:read",
  "customers:update",
  "customers:delete",
  "insurance_types:read",
  "vehicle_types:read",
  "currencies:read",
  "payments:create",
  "payments:read",
  "payments:update",
  "payments:delete",
  "reports:read",
  "reports:export",
];

const AGENT_PERM_KEYS = [
  "dashboard:read",
  "customers:create",
  "customers:read",
  "customers:update",
  "insurance_types:read",
  "vehicle_types:read",
  "currencies:read",
  "payments:read",
];

function allPermissionKeysFromPages(pages) {
  const keys = new Set();
  for (const page of pages) {
    for (const key of permissionKeysForResource(page.resource, page.extraPermissions || [])) {
      keys.add(key);
    }
  }
  return [...keys];
}

function permIdsForKeys(allPerms, keys) {
  const want = new Set(keys);
  return allPerms.filter((p) => want.has(p.key)).map((p) => p._id);
}

async function seed() {
  if (process.env.SEED_CONFIRM !== "yes") {
    console.error("Refusing to wipe DB. Run: SEED_CONFIRM=yes npm run seed");
    process.exit(1);
  }

  await connectDb();
  const dbName = mongoose.connection.name;
  console.log(`Dropping database "${dbName}"…`);
  await mongoose.connection.dropDatabase();

  const pages = INITIAL_PAGES.map((p) => ({ ...p }));
  const permKeys = allPermissionKeysFromPages(pages);
  const permissions = await Permission.insertMany(permKeys.map((key) => ({ key, description: key })));
  const allPermIds = permissions.map((p) => p._id);

  const adminRole = await Role.create({
    name: "Admin",
    description: "Full access",
    permissions: allPermIds,
  });

  const managerRole = await Role.create({
    name: "Manager",
    description: "Operations and reports",
    permissions: permIdsForKeys(permissions, MANAGER_PERM_KEYS),
  });

  const agentRole = await Role.create({
    name: "Agent",
    description: "Day-to-day customer work",
    permissions: permIdsForKeys(permissions, AGENT_PERM_KEYS),
  });

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@insurance.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const superEmail = (process.env.SEED_SUPER_EMAIL || "deq@gmail.com").toLowerCase();
  const superPassword = process.env.SEED_SUPER_PASSWORD || adminPassword;

  await User.create({
    name: "System Admin",
    email: adminEmail,
    password: adminPassword,
    role: adminRole._id,
    isActive: true,
    superEngr: false,
  });

  if (superEmail !== adminEmail) {
    await User.create({
      name: "Eng Deq",
      email: superEmail,
      password: superPassword,
      role: adminRole._id,
      isActive: true,
      superEngr: true,
    });
  } else {
    await User.updateOne({ email: adminEmail }, { $set: { superEngr: true } });
  }

  const currency = await Currency.create({
    code: "ETB",
    name: "Ethiopian Birr",
    symbol: "Br",
    isDefault: true,
  });

  await InsuranceType.create({
    name: "Car Daily",
    description: "Default daily cover",
    dailyPrice: 120,
    currency: currency._id,
  });

  await VehicleType.insertMany(VEHICLE_TYPES);

  const settingsRows = [
    { key: SETTINGS_KEYS.REGISTERED_PAGES, value: pages },
    { key: SETTINGS_KEYS.SIDEBAR_SECTIONS, value: [...INITIAL_SIDEBAR_SECTIONS] },
    { key: SETTINGS_KEYS.DEFAULT_CURRENCY_CODE, value: "ETB" },
    {
      key: SETTINGS_KEYS.NOTIFICATIONS,
      value: { pushEnabled: false, smsEnabled: false },
    },
    {
      key: SETTINGS_KEYS.PAYMENT_API,
      value: { provider: "", publicKey: "", webhookSecret: "" },
    },
    {
      key: SETTINGS_KEYS.SMS,
      value: { provider: "custom", templateId: "" },
    },
  ];
  await Settings.insertMany(settingsRows);

  console.log("\nSeed complete.\n");
  console.log("Login:");
  console.log(`  Admin:  ${adminEmail} / ${adminPassword}`);
  if (superEmail !== adminEmail) {
    console.log(`  Super:  ${superEmail} / ${superPassword}  (superEngr, Page registry)`);
  } else {
    console.log(`  (same user has superEngr: true)`);
  }
  console.log("\nRoles: Admin, Manager, Agent");
  console.log(`Pages: ${pages.length} | Permissions: ${permissions.length}`);
  console.log("\nChange passwords after first login on live.\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
