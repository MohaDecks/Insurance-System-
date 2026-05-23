/** Nav structure comes from GET /api/pages/nav — helpers only. */

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
      if (!item.to) return null;
      if (item.permission && !permissionKeys.has(item.permission)) return null;
      return item;
    })
    .filter(Boolean);
}

function pathMatchesNav(to, pathname) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function navItemOrDescendantActive(item, pathname) {
  if (item.to) return pathMatchesNav(item.to, pathname);
  if (item.children?.length) return item.children.some((c) => navItemOrDescendantActive(c, pathname));
  return false;
}
