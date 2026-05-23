import { VehicleType } from "../models/VehicleType.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listVehicleTypes(req, res, next) {
  try {
    const items = await VehicleType.find({}).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createVehicleType(req, res, next) {
  try {
    const { name, sortOrder = 0 } = req.body;
    if (!name || !String(name).trim()) {
      throw new HttpError(400, "name required");
    }
    const doc = await VehicleType.create({
      name: String(name).trim(),
      sortOrder: Number(sortOrder) || 0,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    if (e.code === 11000) return next(new HttpError(400, "Name already exists"));
    next(e);
  }
}

export async function updateVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const doc = await VehicleType.findById(id);
    if (!doc) throw new HttpError(404, "Not found");
    if (name !== undefined) doc.name = String(name).trim();
    if (sortOrder !== undefined) doc.sortOrder = Number(sortOrder) || 0;
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (e) {
    if (e.code === 11000) return next(new HttpError(400, "Name already exists"));
    next(e);
  }
}

export async function deleteVehicleType(req, res, next) {
  try {
    const { Customer } = await import("../models/Customer.js");
    const { id } = req.params;
    if (await Customer.exists({ vehicleType: id })) {
      throw new HttpError(400, "Type assigned to customers");
    }
    const r = await VehicleType.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
