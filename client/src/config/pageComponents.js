import DashboardPage from "../pages/Dashboard.jsx";
import CustomersPage from "../pages/Customers.jsx";
import CustomerDetailPage from "../pages/CustomerDetail.jsx";
import InsuranceTypesPage from "../pages/InsuranceTypes.jsx";
import VehicleTypesPage from "../pages/VehicleTypes.jsx";
import CurrenciesPage from "../pages/Currencies.jsx";
import PaymentsPage, { PaymentsLedgerTab, PaymentsUnpaidTab } from "../pages/Payments.jsx";
import ReportsPage from "../pages/Reports.jsx";
import SettingsPage from "../pages/Settings.jsx";
import UsersPage from "../pages/Users.jsx";
import RolesPage from "../pages/Roles.jsx";
import ModulesPage from "../pages/Modules.jsx";
import RegisteredPage from "../pages/RegisteredPage.jsx";

/** Maps page `resource` from DB registry → screen component. */
export const PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  customers: CustomersPage,
  insurance_types: InsuranceTypesPage,
  vehicle_types: VehicleTypesPage,
  currencies: CurrenciesPage,
  payments: PaymentsPage,
  reports: ReportsPage,
  settings: SettingsPage,
  users: UsersPage,
  roles: RolesPage,
  pages: ModulesPage,
};

export function resolvePageComponent(resource) {
  return PAGE_COMPONENTS[resource] || RegisteredPage;
}
