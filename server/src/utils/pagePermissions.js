import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { permissionKeysForResource } from "../constants/navModules.js";

export function resourceFromPermissionKey(key) {
  const idx = String(key).indexOf(":");
  return idx === -1 ? key : key.slice(0, idx);
}

/** Permission keys that belong to registered pages only. */
export function allowedPermissionKeysForPages(pages) {
  const keys = new Set();
  for (const p of pages) {
    for (const k of permissionKeysForResource(p.resource, p.extraPermissions || [])) {
      keys.add(k);
    }
  }
  return keys;
}

export async function removePermissionsForResource(resource, extraPermissions = []) {
  const keys = permissionKeysForResource(resource, extraPermissions);
  const perms = await Permission.find({ key: { $in: keys } }).lean();
  if (!perms.length) return;
  const ids = perms.map((p) => p._id);
  await Permission.deleteMany({ _id: { $in: ids } });
  await Role.updateMany({}, { $pull: { permissions: { $in: ids } } });
}

/** Delete permissions for resources not in page registry; clean roles. */
export async function pruneOrphanPermissions(pages) {
  const allowedResources = new Set(pages.map((p) => p.resource));
  const all = await Permission.find({}).lean();
  const orphanIds = all
    .filter((p) => !allowedResources.has(resourceFromPermissionKey(p.key)))
    .map((p) => p._id);
  if (!orphanIds.length) return 0;
  await Permission.deleteMany({ _id: { $in: orphanIds } });
  await Role.updateMany({}, { $pull: { permissions: { $in: orphanIds } } });
  return orphanIds.length;
}
