import { Role } from "../models/Role.js";
import { Permission } from "../models/Permission.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listRoles(req, res, next) {
  try {
    const roles = await Role.find({}).populate("permissions", "key description").sort({ name: 1 });
    res.json({ success: true, data: roles });
  } catch (e) {
    next(e);
  }
}

export async function createRole(req, res, next) {
  try {
    const { name, description = "", permissionIds = [] } = req.body;
    if (!name) throw new HttpError(400, "name required");
    const perms = await Permission.find({ _id: { $in: permissionIds } });
    if (perms.length !== permissionIds.length) {
      throw new HttpError(400, "One or more permission ids invalid");
    }
    const role = await Role.create({ name, description, permissions: permissionIds });
    const out = await Role.findById(role._id).populate("permissions", "key description");
    res.status(201).json({ success: true, data: out });
  } catch (e) {
    if (e.code === 11000) return next(new HttpError(409, "Role name exists"));
    next(e);
  }
}

export async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;
    const role = await Role.findById(id);
    if (!role) throw new HttpError(404, "Role not found");
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissionIds !== undefined) {
      const perms = await Permission.find({ _id: { $in: permissionIds } });
      if (perms.length !== permissionIds.length) {
        throw new HttpError(400, "One or more permission ids invalid");
      }
      role.permissions = permissionIds;
    }
    await role.save();
    const out = await Role.findById(role._id).populate("permissions", "key description");
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    const { User } = await import("../models/User.js");
    const inUse = await User.exists({ role: id });
    if (inUse) throw new HttpError(400, "Role assigned to users");
    const r = await Role.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "Role not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
