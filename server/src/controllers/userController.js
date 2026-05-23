import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listUsers(req, res, next) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { name: new RegExp(String(search), "i") },
        { email: new RegExp(String(search), "i") },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(q)
        .populate("role", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(q),
    ]);
    res.json({ success: true, data: items, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    next(e);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, roleId, isActive = true } = req.body;
    if (!name || !email || !password || !roleId) {
      throw new HttpError(400, "name, email, password, roleId required");
    }
    const role = await Role.findById(roleId);
    if (!role) throw new HttpError(400, "Invalid role");
    const exists = await User.findOne({ email });
    if (exists) throw new HttpError(409, "Email already registered");
    const user = await User.create({
      name,
      email,
      password,
      role: roleId,
      isActive,
    });
    const populated = await User.findById(user._id).populate("role", "name");
    res.status(201).json({ success: true, data: populated });
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, roleId, isActive } = req.body;
    const user = await User.findById(id).select("+password");
    if (!user) throw new HttpError(404, "User not found");
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (roleId !== undefined) {
      const role = await Role.findById(roleId);
      if (!role) throw new HttpError(400, "Invalid role");
      user.role = roleId;
    }
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (password) user.password = password;
    await user.save();
    const out = await User.findById(user._id).populate("role", "name");
    res.json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user._id)) {
      throw new HttpError(400, "Cannot delete yourself");
    }
    const r = await User.findByIdAndDelete(id);
    if (!r) throw new HttpError(404, "User not found");
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
