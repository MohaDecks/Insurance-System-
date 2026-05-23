import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { Permission } from "../models/Permission.js";
import { HttpError } from "./errorHandler.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Authentication required");
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).populate({
      path: "role",
      populate: { path: "permissions", model: "Permission" },
    });
    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid or inactive user");
    }
    const permKeys = new Set(
      (user.role?.permissions || []).map((p) => p.key).filter(Boolean)
    );
    req.user = user;
    req.permissionKeys = permKeys;
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return next(new HttpError(401, "Invalid token"));
    }
    next(e);
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
