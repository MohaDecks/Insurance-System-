import { Permission } from "../models/Permission.js";

export async function listPermissions(req, res, next) {
  try {
    const items = await Permission.find({}).sort({ key: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}
