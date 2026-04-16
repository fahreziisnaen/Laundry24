import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import CreateOrderPage from './pages/orders/CreateOrderPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CreateCustomerPage from './pages/customers/CreateCustomerPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ReportsPage from './pages/reports/ReportsPage';
import DeliveryPage from './pages/delivery/DeliveryPage';
import OutletsPage from './pages/outlets/OutletsPage';
import AttendancePage from './pages/hr/AttendancePage';
import PayrollPage from './pages/hr/PayrollPage';
import ShiftsPage from './pages/hr/ShiftsPage';
import MachinesPage from './pages/machines/MachinesPage';
import ServiceTypesPage from './pages/service-types/ServiceTypesPage';
import SettingsPage from './pages/settings/SettingsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Orders */}
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<CreateOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />

        {/* Customers */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<CreateCustomerPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />

        {/* HR */}
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="hr/attendance" element={<AttendancePage />} />
        <Route path="hr/payroll" element={<PayrollPage />} />
        <Route path="hr/shifts" element={<ShiftsPage />} />

        {/* Operations */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="machines" element={<MachinesPage />} />

        {/* Service types */}
        <Route path="service-types" element={<ServiceTypesPage />} />

        {/* Reports & Delivery */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="delivery" element={<DeliveryPage />} />

        {/* Admin */}
        <Route path="outlets" element={<OutletsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
