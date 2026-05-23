import { Currency } from "../models/Currency.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listCurrencies(req, res, next) {
  try {
    const items = await Currency.find({}).sort({ code: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function createCurrency(req, res, next) {
  try {
    const { code, name, symbol = "", isDefault = false } = req.body;
    if (!code || !name) throw new HttpError(400, "code and name required");
    const c = await Currency.create({ code, name, symbol, isDefault });
    res.status(201).json({ success: true, data: c });
  } catch (e) {
    if (e.code === 11000) return next(new HttpError(409, "Currency code exists"));
    next(e);
  }
}

export async function updateCurrency(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, symbol, isDefault } = req.body;
    const c = await Currency.findById(id);
    if (!c) throw new HttpError(404, "Not found");
    if (code !== undefined) c.code = code;
    if (name !== undefined) c.name = name;
    if (symbol !== undefined) c.symbol = symbol;
    if (typeof isDefault === "boolean") c.isDefault = isDefault;
    await c.save();
    res.json({ success: true, data: c });
  } catch (e) {
    next(e);
  }
}

export async function deleteCurrency(req, res, next) {
  try {
    const { InsuranceType } = await import("../models/InsuranceType.js");
    const { Customer } = await import("../models/Customer.js");
    const { id } = req.params;
    const used =
      (await InsuranceType.exists({ currency: id })) || (await Customer.exists({ currency: id }));
    if (used) throw new HttpError(400, "Currency in use");
    const r = await Currency.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
