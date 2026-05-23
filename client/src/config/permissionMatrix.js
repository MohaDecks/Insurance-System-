/** Human labels for permission resource prefix (before `:`) */
export const RESOURCE_LABELS = {
  dashboard: "Dashboard",
  users: "Users",
  roles: "Roles",
  customers: "Customers",
  insurance_types: "Insurance types",
  vehicle_types: "Vehicle types",
  currencies: "Currencies",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
  notifications: "Notifications",
};

export const CRUD_ORDER = ["create", "read", "update", "delete"];

/** Build grouped rows from API permission list */
export function groupPermissionsForMatrix(permDocs) {
  const groups = {};
  for (const p of permDocs) {
    const idx = p.key.indexOf(":");
    if (idx === -1) continue;
    const resource = p.key.slice(0, idx);
    const action = p.key.slice(idx + 1);
    if (!groups[resource]) groups[resource] = { resource, byAction: {}, extras: [] };
    if (CRUD_ORDER.includes(action)) {
      groups[resource].byAction[action] = p;
    } else {
      groups[resource].extras.push({ action, ...p });
    }
  }
  return Object.values(groups).sort((a, b) => {
    const la = RESOURCE_LABELS[a.resource] || a.resource;
    const lb = RESOURCE_LABELS[b.resource] || b.resource;
    return la.localeCompare(lb);
  });
}
