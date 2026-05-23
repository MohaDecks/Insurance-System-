import { HttpError } from "./errorHandler.js";

/** Any of the listed permissions grants access */
export function requirePermission(...keys) {
  return (req, res, next) => {
    const set = req.permissionKeys;
    if (!set) {
      return next(new HttpError(500, "Permissions not loaded"));
    }
    const ok = keys.some((k) => set.has(k));
    if (!ok) {
      return next(new HttpError(403, "Forbidden"));
    }
    next();
  };
}
