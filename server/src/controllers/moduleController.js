import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { Settings, SETTINGS_KEYS } from "../models/Settings.js";
import { HttpError } from "../middleware/errorHandler.js";
import { buildNavFromPages, filterNavSections, permissionKeysForResource } from "../constants/navModules.js";
import { getRegisteredPages, getRegisteredPagesAll } from "../migrations/ensurePageRegistry.js";
import { removePermissionsForResource } from "../utils/pagePermissions.js";
import { getSidebarSections, saveSidebarSections } from "../utils/pageSections.js";

function slugId(raw, label = "id") {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (!s) throw new HttpError(400, `${label} required (letters, numbers, underscore)`);
  return s;
}

const slugResource = (raw) => slugId(raw, "resource key");
const slugSectionId = (raw) => slugId(raw, "section id");

async function saveRegisteredPages(list) {
  await Settings.findOneAndUpdate(
    { key: SETTINGS_KEYS.REGISTERED_PAGES },
    { $set: { value: list } },
    { upsert: true }
  );
}

async function upsertPermissionsForPage(page) {
  const keys = permissionKeysForResource(page.resource, page.extraPermissions || []);
  for (const key of keys) {
    await Permission.updateOne({ key }, { $setOnInsert: { key, description: key } }, { upsert: true });
  }
}

async function grantPageToAdmin(page) {
  const keys = permissionKeysForResource(page.resource, page.extraPermissions || []);
  const perms = await Permission.find({ key: { $in: keys } }).lean();
  const admin = await Role.findOne({ name: /^admin$/i });
  if (!admin) return;
  const have = new Set(admin.permissions.map((id) => String(id)));
  for (const p of perms) {
    if (!have.has(String(p._id))) admin.permissions.push(p._id);
  }
  await admin.save();
}

/** Pages the current user may open (for React routes). */
function visiblePagesForUser(pages, user, permissionKeys) {
  return pages.filter((p) => {
    if (p.resource === "pages" && !user?.superEngr) return false;
    return permissionKeys.has(`${p.resource}:read`);
  });
}

export async function listMyPages(req, res, next) {
  try {
    const keys = req.permissionKeys || new Set();
    const pages = await getRegisteredPages();
    const data = visiblePagesForUser(pages, req.user, keys);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getNav(req, res, next) {
  try {
    const keys = req.permissionKeys || new Set();
    const pages = await getRegisteredPages();
    const visible = visiblePagesForUser(pages, req.user, keys);
    const sectionDefs = await getSidebarSections();
    const sections = filterNavSections(buildNavFromPages(visible, sectionDefs), keys);
    res.json({ success: true, data: sections });
  } catch (e) {
    next(e);
  }
}

export async function listModules(req, res, next) {
  try {
    const pages = await getRegisteredPagesAll();
    const permissions = await Permission.find({}).sort({ key: 1 }).lean();
    const sections = await getSidebarSections();
    res.json({ success: true, data: { pages, sections, permissions } });
  } catch (e) {
    next(e);
  }
}

export async function listSections(req, res, next) {
  try {
    res.json({ success: true, data: await getSidebarSections() });
  } catch (e) {
    next(e);
  }
}

export async function registerSection(req, res, next) {
  try {
    const id = slugSectionId(req.body.id || req.body.section);
    const sections = await getSidebarSections();
    if (sections.some((s) => s.id === id)) throw new HttpError(409, "Section id already exists");

    const kind = req.body.kind === "menu" ? "menu" : "links";
    const entry = {
      id,
      sidebarTitle: String(req.body.sidebarTitle || req.body.title || id).trim(),
      label: String(req.body.label || id).trim(),
      kind,
      sortOrder: Number(req.body.sortOrder) || 50,
    };
    if (kind === "menu") {
      entry.menuId = String(req.body.menuId || id).trim();
      entry.menuLabel = String(req.body.menuLabel || entry.label).trim();
      entry.menuIcon = String(req.body.menuIcon || "Folder").trim();
    }
    sections.push(entry);
    await saveSidebarSections(sections);
    res.status(201).json({ success: true, data: entry });
  } catch (e) {
    next(e);
  }
}

export async function deleteSection(req, res, next) {
  try {
    const { id } = req.params;
    const sections = await getSidebarSections();
    if (!sections.some((s) => s.id === id)) throw new HttpError(404, "Not found");
    await saveSidebarSections(sections.filter((s) => s.id !== id));
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function registerModule(req, res, next) {
  try {
    const resource = slugResource(req.body.resource || req.body.key);
    const label = String(req.body.label || resource).trim();
    const path = String(req.body.path || `/${resource.replace(/_/g, "-")}`).trim();
    const icon = String(req.body.icon || "FileText").trim();
    const section = String(req.body.section || "app").trim();
    const sections = await getSidebarSections();
    if (!sections.some((s) => s.id === section)) {
      throw new HttpError(400, "Unknown sidebar section — add it under Sidebar sections first");
    }

    const pages = await getRegisteredPagesAll();
    if (pages.some((p) => p.resource === resource)) throw new HttpError(409, "Resource already registered");
    if (pages.some((p) => p.path === path)) throw new HttpError(400, "Path already in use");

    const page = { resource, label, path, icon, section };
    await upsertPermissionsForPage(page);
    await grantPageToAdmin(page);

    pages.push(page);
    await saveRegisteredPages(pages);

    res.status(201).json({
      success: true,
      data: {
        ...page,
        permissionKeys: permissionKeysForResource(resource),
      },
      message: "Page saved. Assign permissions in Roles, then log out and log in.",
    });
  } catch (e) {
    next(e);
  }
}

export async function updateModule(req, res, next) {
  try {
    const { resource } = req.params;
    const pages = await getRegisteredPagesAll();
    const idx = pages.findIndex((p) => p.resource === resource);
    if (idx === -1) throw new HttpError(404, "Not found");

    const cur = pages[idx];
    const label = req.body.label !== undefined ? String(req.body.label).trim() : cur.label;
    const path = req.body.path !== undefined ? String(req.body.path).trim() : cur.path;
    const section = req.body.section !== undefined ? String(req.body.section).trim() : cur.section;
    const icon = req.body.icon !== undefined ? String(req.body.icon).trim() : cur.icon;

    const sectionDefs = await getSidebarSections();
    if (!sectionDefs.some((s) => s.id === section)) {
      throw new HttpError(400, "Unknown sidebar section — add it under Sidebar sections first");
    }

    if (!label) throw new HttpError(400, "label required");
    if (!path.startsWith("/")) throw new HttpError(400, "path must start with /");
    if (pages.some((p) => p.path === path && p.resource !== resource)) {
      throw new HttpError(400, "Path already in use");
    }

    pages[idx] = { ...cur, label, path, section, icon };
    await saveRegisteredPages(pages);
    res.json({ success: true, data: pages[idx] });
  } catch (e) {
    next(e);
  }
}

export async function deleteModule(req, res, next) {
  try {
    const { resource } = req.params;
    const pages = await getRegisteredPagesAll();
    const target = pages.find((p) => p.resource === resource);
    if (!target) throw new HttpError(404, "Not found");
    await removePermissionsForResource(resource, target.extraPermissions || []);
    await saveRegisteredPages(pages.filter((p) => p.resource !== resource));
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
