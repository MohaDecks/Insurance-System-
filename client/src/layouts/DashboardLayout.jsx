import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { filterNavItems, navItemOrDescendantActive, openGroupIdsForPath } from "../config/nav.js";
import { api } from "../api/client.js";
import { Button } from "../components/Button.jsx";

function NavIcon({ name }) {
  const Cmp = Icons[name] || Icons.Circle;
  return <Cmp className="h-4 w-4 shrink-0" />;
}

function NavLeafBullet() {
  return <span className="mx-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />;
}

function NavNode({ item, depth, openGroups, toggleGroup, pathname }) {
  const linkPad = ["pl-3 pr-3", "pl-8 pr-3", "pl-11 pr-3"][depth] ?? "pl-11 pr-3";
  const groupPad = ["pl-3 pr-3", "pl-6 pr-3", "pl-9 pr-3"][depth] ?? "pl-9 pr-3";

  if (item.to) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/"}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-xl py-2 text-sm font-medium transition ${linkPad} ${
            isActive
              ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`
        }
      >
        {item.icon ? <NavIcon name={item.icon} /> : <NavLeafBullet />}
        {item.label}
      </NavLink>
    );
  }

  const id = item.id;
  if (!id) return null;

  const isOpen = openGroups.has(id);
  const childActive = navItemOrDescendantActive(item, pathname);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => toggleGroup(id)}
        className={`flex w-full items-center gap-2 rounded-xl py-2 text-left text-sm font-medium transition ${groupPad} ${
          childActive
            ? "bg-brand-50/60 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
        )}
        {item.icon ? <NavIcon name={item.icon} /> : null}
        <span className="min-w-0 flex-1">{item.label}</span>
      </button>
      {isOpen ? (
        <div className="space-y-1">
          {(item.children || []).map((ch) => (
            <NavNode
              key={ch.id || ch.to || ch.label}
              item={ch}
              depth={depth + 1}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              pathname={pathname}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardLayout() {
  const { user, logout, permissionKeys } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [navSections, setNavSections] = useState([]);
  const [openGroups, setOpenGroups] = useState(() => openGroupIdsForPath(window.location.pathname));

  useEffect(() => {
    if (!user) {
      setNavSections([]);
      return;
    }
    api
      .get("/pages/nav")
      .then(({ data }) => setNavSections(data.data || []))
      .catch(() => setNavSections([]));
  }, [user?.id]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      openGroupIdsForPath(location.pathname).forEach((id) => next.add(id));
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = useCallback((id) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">Insurance</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">Management</div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navSections.map((section) => {
            const items = filterNavItems(section.items, permissionKeys);
            if (!items.length) return null;
            return (
              <div key={section.title}>
                <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavNode
                      key={item.id || item.to || item.label}
                      item={item}
                      depth={0}
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                      pathname={location.pathname}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800">
          Signed in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
          <div className="mt-1 text-[11px] uppercase text-slate-400">{user?.role?.name}</div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="md:hidden text-sm font-semibold">Insurance</div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              className="!py-1.5 !px-3 text-xs"
              onClick={() => {
                document.documentElement.classList.toggle("dark");
              }}
            >
              Theme
            </Button>
            <Button
              variant="secondary"
              className="!py-1.5 !px-3 text-xs"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
