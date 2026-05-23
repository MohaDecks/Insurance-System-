import { Settings, SETTINGS_KEYS } from "../models/Settings.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { CRUD_ACTIONS, permissionKeysForResource } from "../constants/navModules.js";
import { pruneOrphanPermissions } from "../utils/pagePermissions.js";
import { ensureSidebarSections } from "../utils/pageSections.js";

/** Default page registry (seed + empty-DB startup). */
export const INITIAL_PAGES = [
  { resource: "dashboard", label: "Dashboard", path: "/", icon: "LayoutDashboard", section: "overview" },
  { resource: "customers", label: "Customers", path: "/customers", icon: "Users", section: "insurance" },
  { resource: "insurance_types", label: "Insurance types", path: "/insurance-types", icon: "Shield", section: "insurance" },
  { resource: "vehicle_types", label: "Vehicle types", path: "/vehicle-types", icon: "Truck", section: "insurance" },
  { resource: "currencies", label: "Currencies", path: "/currencies", icon: "Coins", section: "insurance" },
  { resource: "payments", label: "Payments", path: "/payments", icon: "Wallet", section: "insurance" },
  { resource: "reports", label: "Reports", path: "/reports", icon: "BarChart3", section: "insights", extraPermissions: ["export"] },
  { resource: "users", label: "Users", path: "/users", icon: "UserCog", section: "system" },
  { resource: "roles", label: "Roles & permissions", path: "/roles", icon: "Lock", section: "system" },
  { resource: "pages", label: "Page registry", path: "/pages", icon: "PanelsTopLeft", section: "registry" },
  { resource: "settings", label: "Settings", path: "/settings", icon: "Settings", section: "system" },
  { resource: "notifications", label: "Notifications", path: "/settings", icon: "Bell", section: "system", extraPermissions: ["send"], hideFromNav: true },
];

async function upsertPermissionsForPage(page) {
  const keys = permissionKeysForResource(page.resource, page.extraPermissions || []);
  for (const key of keys) {
    await Permission.updateOne({ key }, { $setOnInsert: { key, description: key } }, { upsert: true });
  }
}

async function syncAllPermissionsFromPages(pages) {
  for (const p of pages) await upsertPermissionsForPage(p);
  const adminRoles = await Role.find({ name: /admin/i });
  if (!adminRoles.length) return;
  const all = await Permission.find({}).lean();
  for (const admin of adminRoles) {
    const have = new Set(admin.permissions.map((id) => String(id)));
    for (const perm of all) {
      if (!have.has(String(perm._id))) admin.permissions.push(perm._id);
    }
    await admin.save();
  }
}

export async function ensurePageRegistry() {
  const row = await Settings.findOne({ key: SETTINGS_KEYS.REGISTERED_PAGES });
  const raw = row?.value;
  let pages = Array.isArray(raw) ? raw : [];

  if (!pages.length) {
    pages = INITIAL_PAGES.map((p) => ({ ...p }));
    await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.REGISTERED_PAGES },
      { $set: { value: pages } },
      { upsert: true }
    );
    console.log(`[ensurePageRegistry] Seeded ${pages.length} default page(s) (registry was empty)`);
  }

  const legacy = await Settings.findOne({ key: SETTINGS_KEYS.CUSTOM_NAV_MODULES });
  if (Array.isArray(legacy?.value) && legacy.value.length) {
    for (const m of legacy.value) {
      if (!pages.some((p) => p.resource === m.resource)) {
        pages.push({
          resource: m.resource,
          label: m.label,
          path: m.path,
          icon: m.icon || "FileText",
          section: m.section || "app",
        });
      }
    }
    await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.REGISTERED_PAGES },
      { $set: { value: pages } },
      { upsert: true }
    );
  }

  let changed = false;
  if (!pages.some((p) => p.resource === "pages")) {
    pages.push({
      resource: "pages",
      label: "Page registry",
      path: "/pages",
      icon: "PanelsTopLeft",
      section: "registry",
    });
    changed = true;
  }
  for (const p of pages) {
    if (p.path === "/modules") {
      p.path = "/pages";
      changed = true;
    }
    if (p.resource === "pages" && p.section === "system") {
      p.section = "registry";
      changed = true;
    }
  }
  if (changed) {
    await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.REGISTERED_PAGES },
      { $set: { value: pages } },
      { upsert: true }
    );
  }

  await ensureSidebarSections();
  await syncAllPermissionsFromPages(pages);
  const removed = await pruneOrphanPermissions(pages);
  if (removed) console.log(`Removed ${removed} orphan permission(s) not in page registry`);
}

export async function getRegisteredPages() {
  const row = await Settings.findOne({ key: SETTINGS_KEYS.REGISTERED_PAGES });
  const pages = Array.isArray(row?.value) ? row.value : [];
  return pages.filter((p) => !p.hideFromNav);
}

export async function getRegisteredPagesAll() {
  const row = await Settings.findOne({ key: SETTINGS_KEYS.REGISTERED_PAGES });
  return Array.isArray(row?.value) ? row.value : [];
}
