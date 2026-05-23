export const CRUD_ACTIONS = ["create", "read", "update", "delete"];

export function permissionKeysForResource(resource, extraKeys = []) {
  const keys = CRUD_ACTIONS.map((a) => `${resource}:${a}`);
  for (const k of extraKeys) keys.push(k.includes(":") ? k : `${resource}:${k}`);
  return keys;
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

export function filterNavSections(sections, permissionKeys) {
  return sections
    .map((s) => {
      const items = filterNavItems(s.items, permissionKeys);
      if (!items.length) return null;
      return { ...s, items };
    })
    .filter(Boolean);
}

function toNavLink(p) {
  return {
    to: p.path,
    label: p.label,
    icon: p.icon || "FileText",
    permission: `${p.resource}:read`,
  };
}

/** Sidebar from registered pages + section definitions (both from MongoDB). */
export function buildNavFromPages(pages, sectionDefs) {
  const defs = [...(sectionDefs || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const blocks = new Map();

  for (const def of defs) {
    const links = pages.filter((p) => p.section === def.id).map(toNavLink);
    if (!links.length) continue;

    const title = def.sidebarTitle || def.title || def.id;
    let blockItems = blocks.get(title)?.items || [];

    if (def.kind === "menu") {
      blockItems.push({
        id: def.menuId || def.id,
        label: def.menuLabel || def.label || def.id,
        icon: def.menuIcon || "Folder",
        children: links,
      });
    } else {
      blockItems = blockItems.concat(links);
    }

    blocks.set(title, { title, items: blockItems });
  }

  return [...blocks.values()];
}
