import mongoose from "mongoose";
import { VehicleType } from "../models/VehicleType.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";

const DEFAULT_TYPES = [
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

const VT_PERM_KEYS = ["vehicle_types:create", "vehicle_types:read", "vehicle_types:update", "vehicle_types:delete"];

async function ensureVehicleTypePermissions() {
  for (const key of VT_PERM_KEYS) {
    await Permission.updateOne({ key }, { $setOnInsert: { key, description: key } }, { upsert: true });
  }
  const vtPerms = await Permission.find({ key: { $in: VT_PERM_KEYS } }).lean();
  const admin = await Role.findOne({ name: "Admin" });
  if (admin && vtPerms.length) {
    const have = new Set(admin.permissions.map((id) => String(id)));
    for (const p of vtPerms) {
      if (!have.has(String(p._id))) admin.permissions.push(p._id);
    }
    await admin.save();
  }
  const readPerm = await Permission.findOne({ key: "vehicle_types:read" });
  if (readPerm) {
    for (const roleName of ["Manager", "Agent"]) {
      const role = await Role.findOne({ name: roleName });
      if (!role) continue;
      if (!role.permissions.some((id) => String(id) === String(readPerm._id))) {
        role.permissions.push(readPerm._id);
        await role.save();
      }
    }
  }
}

/**
 * Ensures catalog rows exist and migrates legacy customers whose vehicleType was a string enum.
 */
export async function ensureVehicleTypesAndMigrateCustomers() {
  await ensureVehicleTypePermissions();

  for (const t of DEFAULT_TYPES) {
    await VehicleType.findOneAndUpdate(
      { name: t.name },
      { $set: { name: t.name, sortOrder: t.sortOrder } },
      { upsert: true }
    );
  }

  const types = await VehicleType.find().lean();
  const nameToId = Object.fromEntries(types.map((v) => [v.name, v._id]));
  const fallback =
    nameToId.Other || nameToId.Car || types[0]?._id;
  if (!fallback) return;

  const coll = mongoose.connection.collection("customers");
  const legacy = await coll.find({ vehicleType: { $type: "string" } }).toArray();
  for (const doc of legacy) {
    const id = nameToId[doc.vehicleType] || fallback;
    await coll.updateOne({ _id: doc._id }, { $set: { vehicleType: id } });
  }
  if (legacy.length) {
    console.log(`Migrated ${legacy.length} customer(s) to VehicleType references`);
  }
}
