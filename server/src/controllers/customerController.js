import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Payment } from "../models/Payment.js";
import { VehicleType } from "../models/VehicleType.js";
import { ID_TYPES, REF_RELATIONS } from "../constants/customerRegistration.js";
import { HttpError } from "../middleware/errorHandler.js";
import { refreshCustomerStatus } from "../services/customerStatus.js";
import { startOfUtcDay } from "../utils/date.js";
import { customerUploadDir } from "../config/uploads.js";
import { attachCustomerIdDocUrls, MAX_ID_DOCUMENTS } from "../utils/customerIdDocs.js";

async function requireVehicleTypeId(raw) {
  if (!raw || !mongoose.isValidObjectId(raw)) {
    throw new HttpError(400, "vehicleTypeId required");
  }
  const vt = await VehicleType.findById(raw).select("_id");
  if (!vt) throw new HttpError(400, "Invalid vehicle type");
  return raw;
}

function requireIdType(raw) {
  const s = String(raw ?? "").trim();
  if (!s) throw new HttpError(400, "idType required");
  if (!ID_TYPES.includes(s)) throw new HttpError(400, "Invalid idType");
  return s;
}

function requireCni(raw) {
  const s = String(raw ?? "").trim();
  if (!s) throw new HttpError(400, "cni (customer ID number) required");
  return s;
}

function parseOptionalRefRelation(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (!REF_RELATIONS.includes(s)) throw new HttpError(400, "Invalid refRelation");
  return s;
}

export async function listCustomers(req, res, next) {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) {
      const rx = new RegExp(String(search), "i");
      q.$or = [{ fullName: rx }, { phoneNumber: rx }, { cni: rx }];
    }
    if (status === "PAID" || status === "UNPAID") q.paymentStatus = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Customer.find(q)
        .populate("vehicleType", "name sortOrder")
        .populate("insuranceType", "name dailyPrice")
        .populate("currency", "code symbol")
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Customer.countDocuments(q),
    ]);
    res.json({
      success: true,
      data: items.map((c) => attachCustomerIdDocUrls(c)),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    next(e);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const c = await Customer.findById(req.params.id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType")
      .populate("currency")
      .populate("createdBy", "name email");
    if (!c) throw new HttpError(404, "Not found");
    await refreshCustomerStatus(c._id);
    const fresh = await Customer.findById(c._id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType")
      .populate("currency")
      .populate("createdBy", "name email");
    const payments = await Payment.find({ customer: c._id })
      .populate("currency", "code symbol")
      .populate("recordedBy", "name email")
      .sort({ forDate: -1 })
      .limit(200);
    res.json({ success: true, data: attachCustomerIdDocUrls(fresh), payments });
  } catch (e) {
    next(e);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const {
      fullName,
      phoneNumber,
      address = "",
      idType,
      cni,
      refRelation,
      refName = "",
      refPhone = "",
      vehicleTypeId,
      insuranceTypeId,
      currencyId,
      notes = "",
    } = req.body;
    if (!fullName || !phoneNumber || !vehicleTypeId || !insuranceTypeId || !currencyId) {
      throw new HttpError(400, "Missing required fields");
    }
    const vtId = await requireVehicleTypeId(vehicleTypeId);
    const idTypeVal = requireIdType(idType);
    const cniVal = requireCni(cni);
    const refRel = parseOptionalRefRelation(refRelation);
    const doc = await Customer.create({
      fullName,
      phoneNumber,
      address,
      idType: idTypeVal,
      cni: cniVal,
      refRelation: refRel,
      refName: String(refName).trim(),
      refPhone: String(refPhone).trim(),
      vehicleType: vtId,
      insuranceType: insuranceTypeId,
      currency: currencyId,
      notes,
      createdBy: req.user._id,
    });
    await refreshCustomerStatus(doc._id);
    const out = await Customer.findById(doc._id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType", "name dailyPrice")
      .populate("currency", "code symbol");
    res.status(201).json({ success: true, data: attachCustomerIdDocUrls(out) });
  } catch (e) {
    next(e);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Customer.findById(id);
    if (!doc) throw new HttpError(404, "Not found");
    const b = req.body;
    if (b.fullName !== undefined) doc.fullName = b.fullName;
    if (b.phoneNumber !== undefined) doc.phoneNumber = b.phoneNumber;
    if (b.address !== undefined) doc.address = b.address;
    if (b.idType !== undefined) {
      const s = String(b.idType).trim();
      if (!s) doc.idType = "";
      else if (!ID_TYPES.includes(s)) throw new HttpError(400, "Invalid idType");
      else doc.idType = s;
    }
    if (b.cni !== undefined) doc.cni = String(b.cni).trim();
    if (b.refRelation !== undefined) doc.refRelation = parseOptionalRefRelation(b.refRelation);
    if (b.refName !== undefined) doc.refName = String(b.refName).trim();
    if (b.refPhone !== undefined) doc.refPhone = String(b.refPhone).trim();
    if (b.vehicleTypeId !== undefined) doc.vehicleType = await requireVehicleTypeId(b.vehicleTypeId);
    if (b.insuranceTypeId !== undefined) doc.insuranceType = b.insuranceTypeId;
    if (b.currencyId !== undefined) doc.currency = b.currencyId;
    if (b.notes !== undefined) doc.notes = b.notes;
    await doc.save();
    await refreshCustomerStatus(doc._id);
    const out = await Customer.findById(doc._id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType", "name dailyPrice")
      .populate("currency", "code symbol");
    res.json({ success: true, data: attachCustomerIdDocUrls(out) });
  } catch (e) {
    next(e);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    await Payment.deleteMany({ customer: id });
    const dir = customerUploadDir(id);
    await fs.rm(dir, { recursive: true, force: true });
    const r = await Customer.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** POST multipart field name: `file` */
export async function addIdDocument(req, res, next) {
  let uploadedPath;
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new HttpError(400, "Invalid customer id");
    }
    if (!req.file) throw new HttpError(400, "file is required (image or PDF)");
    uploadedPath = req.file.path;
    const doc = await Customer.findById(req.params.id);
    if (!doc) {
      await fs.unlink(uploadedPath).catch(() => {});
      throw new HttpError(404, "Not found");
    }
    if ((doc.idDocuments?.length || 0) >= MAX_ID_DOCUMENTS) {
      await fs.unlink(uploadedPath).catch(() => {});
      throw new HttpError(400, `Maximum ${MAX_ID_DOCUMENTS} ID documents per customer`);
    }
    doc.idDocuments.push({
      fileId: req.file.filename,
      originalName: req.file.originalname || "",
      mimeType: req.file.mimetype || "",
      size: req.file.size || 0,
      uploadedAt: new Date(),
    });
    await doc.save();
    const out = await Customer.findById(doc._id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType", "name dailyPrice")
      .populate("currency", "code symbol");
    res.status(201).json({ success: true, data: attachCustomerIdDocUrls(out) });
  } catch (e) {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    next(e);
  }
}

export async function removeIdDocument(req, res, next) {
  try {
    const { id, fileId } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid customer id");
    if (!fileId || fileId.includes("..") || fileId.includes("/")) {
      throw new HttpError(400, "Invalid fileId");
    }
    const doc = await Customer.findById(id);
    if (!doc) throw new HttpError(404, "Not found");
    const idx = (doc.idDocuments || []).findIndex((d) => d.fileId === fileId);
    if (idx === -1) throw new HttpError(404, "File not found");
    doc.idDocuments.splice(idx, 1);
    await doc.save();
    const fp = path.join(customerUploadDir(id), fileId);
    await fs.unlink(fp).catch(() => {});
    const out = await Customer.findById(doc._id)
      .populate("vehicleType", "name sortOrder")
      .populate("insuranceType", "name dailyPrice")
      .populate("currency", "code symbol");
    res.json({ success: true, data: attachCustomerIdDocUrls(out) });
  } catch (e) {
    next(e);
  }
}

/** Recompute status for today for all or one customer */
export async function syncStatuses(req, res, next) {
  try {
    const { customerId } = req.query;
    const day = startOfUtcDay();
    if (customerId) {
      await refreshCustomerStatus(customerId, day);
      return res.json({ success: true });
    }
    const { refreshAllCustomersForDay } = await import("../services/customerStatus.js");
    await refreshAllCustomersForDay(day);
    res.json({ success: true, message: "Statuses refreshed for UTC day" });
  } catch (e) {
    next(e);
  }
}
