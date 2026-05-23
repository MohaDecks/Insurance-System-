import { Permission } from "../models/Permission.js";

/** Effective permission keys for API + client (superEngr gets all registered perms). */
export async function resolvePermissionKeys(user) {
  const keys = new Set(
    (user.role?.permissions || []).map((p) => p.key).filter(Boolean)
  );
  if (user.superEngr) {
    const all = await Permission.find({}).select("key").lean();
    for (const p of all) keys.add(p.key);
  }
  return keys;
}
