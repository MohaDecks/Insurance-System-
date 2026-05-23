import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { HttpError } from "../middleware/errorHandler.js";
import { signToken } from "../middleware/auth.js";
import { resolvePermissionKeys } from "../utils/userPermissions.js";

function userPayload(user, permissionKeys) {
  const role = user.role;
  const permissions = permissionKeys ? [...permissionKeys] : (role?.permissions || []).map((p) => p.key);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: role
      ? { id: role._id, name: role.name, permissions }
      : null,
    permissionKeys: permissions,
    superEngr: !!user.superEngr,
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new HttpError(400, "Email and password required");
    }
    const user = await User.findOne({ email }).select("+password").populate({
      path: "role",
      populate: { path: "permissions", model: "Permission" },
    });
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, "Invalid credentials");
    }
    if (!user.isActive) {
      throw new HttpError(403, "Account disabled");
    }
    const permissionKeys = await resolvePermissionKeys(user);
    const token = signToken(user._id);
    res.json({ success: true, token, user: userPayload(user, permissionKeys) });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ success: true, user: userPayload(req.user, req.permissionKeys) });
  } catch (e) {
    next(e);
  }
}
