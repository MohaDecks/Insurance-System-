import { HttpError } from "./errorHandler.js";

/** Page registry (/pages) — only users with superEngr: true */
export function requireSuperEngr(req, res, next) {
  if (!req.user?.superEngr) {
    return next(new HttpError(403, "Super engineer access required"));
  }
  next();
}
