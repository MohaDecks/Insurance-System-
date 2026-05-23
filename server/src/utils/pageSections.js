import { Settings, SETTINGS_KEYS } from "../models/Settings.js";

export const INITIAL_SIDEBAR_SECTIONS = [
  { id: "registry", sidebarTitle: "Pages", label: "Page registry", kind: "links", sortOrder: 0 },
  {
    id: "overview",
    sidebarTitle: "Overview",
    label: "Overview (top link)",
    kind: "links",
    sortOrder: 10,
  },
  {
    id: "insurance",
    sidebarTitle: "Overview",
    label: "Insurance menu",
    kind: "menu",
    menuId: "insurance",
    menuLabel: "Insurance",
    menuIcon: "Shield",
    sortOrder: 11,
  },
  {
    id: "insights",
    sidebarTitle: "Insights",
    label: "Insights",
    kind: "menu",
    menuId: "reports",
    menuLabel: "Reports",
    menuIcon: "BarChart3",
    sortOrder: 20,
  },
  { id: "app", sidebarTitle: "App modules", label: "App modules", kind: "links", sortOrder: 30 },
  {
    id: "system",
    sidebarTitle: "Settings",
    label: "System menu",
    kind: "menu",
    menuId: "system",
    menuLabel: "System",
    menuIcon: "SlidersHorizontal",
    sortOrder: 40,
  },
];

export async function getSidebarSections() {
  const row = await Settings.findOne({ key: SETTINGS_KEYS.SIDEBAR_SECTIONS });
  if (Array.isArray(row?.value) && row.value.length) return row.value;
  return [...INITIAL_SIDEBAR_SECTIONS];
}

export async function saveSidebarSections(list) {
  await Settings.findOneAndUpdate(
    { key: SETTINGS_KEYS.SIDEBAR_SECTIONS },
    { $set: { value: list } },
    { upsert: true }
  );
}

export async function ensureSidebarSections() {
  const row = await Settings.findOne({ key: SETTINGS_KEYS.SIDEBAR_SECTIONS });
  if (!Array.isArray(row?.value) || !row.value.length) {
    await saveSidebarSections([...INITIAL_SIDEBAR_SECTIONS]);
  }
}
