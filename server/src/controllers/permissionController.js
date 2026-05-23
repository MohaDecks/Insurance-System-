import { Permission } from "../models/Permission.js";
import { getRegisteredPagesAll } from "../migrations/ensurePageRegistry.js";
import { allowedPermissionKeysForPages } from "../utils/pagePermissions.js";

export async function listPermissions(req, res, next) {
  try {
    const pages = await getRegisteredPagesAll();
    const allowed = allowedPermissionKeysForPages(pages);
    const items = await Permission.find({ key: { $in: [...allowed] } }).sort({ key: 1 });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}
