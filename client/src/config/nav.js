/**
 * Sidebar menu — items shown only if the user has `permission`.
 * Matches server permission keys (RBAC + JWT).
 *
 * Items may have `children` for collapsible groups (no `to` on the parent).
 * `id` is required on group parents for expand/collapse state.
 */
export const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: "LayoutDashboard", permission: "dashboard:read" },
      {
        id: "insurance",
        label: "Insurance",
        icon: "Shield",
        children: [
          { to: "/customers", label: "Customers", icon: "Users", permission: "customers:read" },
          { to: "/insurance-types", label: "Insurance types", icon: "Shield", permission: "insurance_types:read" },
          { to: "/vehicle-types", label: "Vehicle types", icon: "Truck", permission: "vehicle_types:read" },
          { to: "/currencies", label: "Currencies", icon: "Coins", permission: "currencies:read" },
          {
            id: "payments",
            label: "Payments",
            icon: "Wallet",
            permission: "payments:read",
            children: [
              { to: "/payments/unpaid", label: "Unpaid", permission: "payments:read" },
              { to: "/payments/paid", label: "Paid", permission: "payments:read" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        id: "reports",
        label: "Reports",
        icon: "BarChart3",
        permission: "reports:read",
        children: [{ to: "/reports", label: "Daily collections", permission: "reports:read" }],
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        id: "system",
        label: "System",
        icon: "SlidersHorizontal",
        children: [
          { to: "/users", label: "Users", icon: "UserCog", permission: "users:read" },
          { to: "/roles", label: "Roles & permissions", icon: "Lock", permission: "roles:read" },
          { to: "/settings", label: "Settings", icon: "Settings", permission: "settings:read" },
        ],
      },
    ],
  },
];

/** Returns group ids that should be expanded for the current path. */
export function openGroupIdsForPath(pathname) {
  const s = new Set();
  if (
    pathname.startsWith("/customers") ||
    pathname.startsWith("/insurance-types") ||
    pathname.startsWith("/vehicle-types") ||
    pathname.startsWith("/currencies") ||
    pathname.startsWith("/payments")
  ) {
    s.add("insurance");
  }
  if (pathname.startsWith("/payments")) s.add("payments");
  if (pathname.startsWith("/users") || pathname.startsWith("/roles") || pathname.startsWith("/settings")) {
    s.add("system");
  }
  if (pathname.startsWith("/reports")) s.add("reports");
  return s;
}

export function filterNavItems(items, permissionKeys) {
  if (!items?.length) return [];
  return items
    .map((item) => {
      if (item.children?.length) {
        if (item.permission && !permissionKeys.has(item.permission)) return null;
        const children = filterNavItems(item.children, permissionKeys);
        if (!children.length) return null;
        return { ...item, children };
      }
      if (item.permission && !permissionKeys.has(item.permission)) return null;
      return item;
    })
    .filter(Boolean);
}

function pathMatchesNav(to, pathname) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** True if this item or any descendant link matches the URL (for parent highlight). */
export function navItemOrDescendantActive(item, pathname) {
  if (item.to) return pathMatchesNav(item.to, pathname);
  if (item.children?.length) return item.children.some((c) => navItemOrDescendantActive(c, pathname));
  return false;
}
