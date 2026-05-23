import { useEffect, useState } from "react";
import { Navigate, Route } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { resolvePageComponent } from "../config/pageComponents.js";
import CustomerDetailPage from "../pages/CustomerDetail.jsx";
import { PaymentsLedgerTab, PaymentsUnpaidTab } from "../pages/Payments.jsx";

function PermGate({ perm, children }) {
  const { permissionKeys, isSuperEngr } = useAuth();
  if (!isSuperEngr && !permissionKeys.has(perm)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
        You do not have permission to view this page.
      </div>
    );
  }
  return children;
}

/** Routes from DB page registry (/api/pages/me) — no static permission/nav lists. */
export function usePageRoutes() {
  const [pages, setPages] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPages([]);
      return;
    }
    api
      .get("/pages/me")
      .then(({ data }) => setPages(data.data || []))
      .catch(() => setPages([]));
  }, [user?.id]);

  const routes = [];

  for (const p of pages) {
    const routePath = p.path === "/" ? "" : p.path.replace(/^\//, "");
    const perm = `${p.resource}:read`;
    const Screen = resolvePageComponent(p.resource);

    if (p.resource === "payments") {
      routes.push(
        <Route
          key={p.resource}
          path="payments"
          element={
            <PermGate perm={perm}>
              <Screen />
            </PermGate>
          }
        >
          <Route index element={<Navigate to="unpaid" replace />} />
          <Route path="unpaid" element={<PaymentsUnpaidTab />} />
          <Route path="paid" element={<PaymentsLedgerTab />} />
          <Route path="ledger" element={<Navigate to="/payments/paid" replace />} />
        </Route>
      );
      continue;
    }

    routes.push(
      <Route
        key={p.resource}
        path={routePath}
        index={p.path === "/"}
        element={
          <PermGate perm={perm}>
            <Screen />
          </PermGate>
        }
      />
    );

    if (p.resource === "customers") {
      routes.push(
        <Route
          key="customers-detail"
          path="customers/:id"
          element={
            <PermGate perm={perm}>
              <CustomerDetailPage />
            </PermGate>
          }
        />
      );
    }
  }

  return routes;
}
