import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { DashboardLayout } from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/Login.jsx";
import DashboardPage from "./pages/Dashboard.jsx";
import CustomersPage from "./pages/Customers.jsx";
import CustomerDetailPage from "./pages/CustomerDetail.jsx";
import InsuranceTypesPage from "./pages/InsuranceTypes.jsx";
import VehicleTypesPage from "./pages/VehicleTypes.jsx";
import CurrenciesPage from "./pages/Currencies.jsx";
import PaymentsPage, { PaymentsLedgerTab, PaymentsUnpaidTab } from "./pages/Payments.jsx";
import ReportsPage from "./pages/Reports.jsx";
import SettingsPage from "./pages/Settings.jsx";
import UsersPage from "./pages/Users.jsx";
import RolesPage from "./pages/Roles.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading…</div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequirePerm({ perm, children }) {
  const { permissionKeys } = useAuth();
  if (!permissionKeys.has(perm)) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
        You do not have permission to view this page.
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <RequirePerm perm="dashboard:read">
              <DashboardPage />
            </RequirePerm>
          }
        />
        <Route
          path="customers"
          element={
            <RequirePerm perm="customers:read">
              <CustomersPage />
            </RequirePerm>
          }
        />
        <Route
          path="customers/:id"
          element={
            <RequirePerm perm="customers:read">
              <CustomerDetailPage />
            </RequirePerm>
          }
        />
        <Route
          path="insurance-types"
          element={
            <RequirePerm perm="insurance_types:read">
              <InsuranceTypesPage />
            </RequirePerm>
          }
        />
        <Route
          path="vehicle-types"
          element={
            <RequirePerm perm="vehicle_types:read">
              <VehicleTypesPage />
            </RequirePerm>
          }
        />
        <Route
          path="currencies"
          element={
            <RequirePerm perm="currencies:read">
              <CurrenciesPage />
            </RequirePerm>
          }
        />
        <Route
          path="payments"
          element={
            <RequirePerm perm="payments:read">
              <PaymentsPage />
            </RequirePerm>
          }
        >
          <Route index element={<Navigate to="unpaid" replace />} />
          <Route path="unpaid" element={<PaymentsUnpaidTab />} />
          <Route path="paid" element={<PaymentsLedgerTab />} />
          <Route path="ledger" element={<Navigate to="/payments/paid" replace />} />
        </Route>
        <Route
          path="reports"
          element={
            <RequirePerm perm="reports:read">
              <ReportsPage />
            </RequirePerm>
          }
        />
        <Route
          path="settings"
          element={
            <RequirePerm perm="settings:read">
              <SettingsPage />
            </RequirePerm>
          }
        />
        <Route
          path="users"
          element={
            <RequirePerm perm="users:read">
              <UsersPage />
            </RequirePerm>
          }
        />
        <Route
          path="roles"
          element={
            <RequirePerm perm="roles:read">
              <RolesPage />
            </RequirePerm>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
