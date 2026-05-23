import { InsuranceType } from "../models/InsuranceType.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listInsuranceTypes(req, res, next) {
  try {
    const items = await InsuranceType.find({}).populate("currency", "code symbol name").sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createInsuranceType(req, res, next) {
  try {
    const { name, description = "", dailyPrice, currencyId } = req.body;
    if (!name || dailyPrice === undefined || !currencyId) {
      throw new HttpError(400, "name, dailyPrice, currencyId required");
    }
    const doc = await InsuranceType.create({
      name,
      description,
      dailyPrice: Number(dailyPrice),
      currency: currencyId,
    });
    const out = await InsuranceType.findById(doc._id).populate("currency", "code symbol name");
    res.status(201).json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function updateInsuranceType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, dailyPrice, currencyId } = req.body;
    const doc = await InsuranceType.findById(id);
    if (!doc) throw new HttpError(404, "Not found");
    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;
    if (dailyPrice !== undefined) doc.dailyPrice = Number(dailyPrice);
    if (currencyId !== undefined) doc.currency = currencyId;
    await doc.save();
    const out = await InsuranceType.findById(doc._id).populate("currency", "code symbol name");
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function deleteInsuranceType(req, res, next) {
  try {
    const { Customer } = await import("../models/Customer.js");
    const { id } = req.params;
    if (await Customer.exists({ insuranceType: id })) {
      throw new HttpError(400, "Type assigned to customers");
    }
    const r = await InsuranceType.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
