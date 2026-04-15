import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, Users, UserCheck,
  Package, BarChart3, Truck, Building2,
  Bell, LogOut, Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/orders',     label: 'Orders',     icon: ShoppingBag },
  { to: '/customers',  label: 'Customers',  icon: Users },
  { to: '/employees',  label: 'Employees',  icon: UserCheck },
  { to: '/inventory',  label: 'Inventory',  icon: Package },
  { to: '/reports',    label: 'Reports',    icon: BarChart3 },
  { to: '/delivery',   label: 'Delivery',   icon: Truck },
  { to: '/outlets',    label: 'Outlets',    icon: Building2 },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-col bg-brand text-white transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 h-16">
          <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-brand flex-shrink-0">
            L
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg whitespace-nowrap">Laundry24</span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-white/10">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-white/60 text-xs mt-0.5">{user.role}</p>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {user && <span className="text-sm font-medium hidden md:block">{user.name}</span>}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
