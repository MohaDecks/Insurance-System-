import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { HttpError } from "./errorHandler.js";
import { resolvePermissionKeys } from "../utils/userPermissions.js";

const DEFAULT_JWT_SECRET = "insurance-management-default-jwt-secret";

function jwtSecret() {
  const s = process.env.JWT_SECRET?.trim();
  return s || DEFAULT_JWT_SECRET;
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Authentication required");
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, jwtSecret());
    const user = await User.findById(payload.sub).populate({
      path: "role",
      populate: { path: "permissions", model: "Permission" },
    });
    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid or inactive user");
    }
    req.user = user;
    req.permissionKeys = await resolvePermissionKeys(user);
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return next(new HttpError(401, "Invalid token"));
    }
    next(e);
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
