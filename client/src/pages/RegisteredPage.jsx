import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client.js";

/** Same shell as built-in pages — for any page registered in Page registry (custom routes). */
export default function RegisteredPage() {
  const { pathname } = useLocation();
  const [page, setPage] = useState(null);

  useEffect(() => {
    api
      .get("/pages/me")
      .then(({ data }) => {
        const found = (data.data || []).find((p) => p.path === pathname);
        setPage(found || null);
      })
      .catch(() => setPage(null));
  }, [pathname]);

  if (!page) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500">Page not found in registry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{page.label}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registered page · key <code className="text-xs">{page.resource}</code> · permission{" "}
          <code className="text-xs">{page.resource}:read</code>
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This page works like built-in pages in the sidebar and permissions. Add your own UI here in code when
          you are ready (same as Customers, Users, etc.).
        </p>
      </div>
    </div>
  );
}
