import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, Users, UserCheck,
  Package, BarChart3, Truck, Building2,
  Bell, LogOut, Menu, X, Clock, Cpu,
  Settings, CalendarDays, DollarSign, Tags,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../services/api';
import clsx from 'clsx';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'UTAMA',
    items: [
      { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/orders',    label: 'POS / Orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'PELANGGAN',
    items: [
      { to: '/customers', label: 'Pelanggan',   icon: Users },
      { to: '/delivery',  label: 'Pengiriman',  icon: Truck },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      { to: '/inventory', label: 'Inventory',   icon: Package },
      { to: '/machines',  label: 'Mesin (IoT)', icon: Cpu },
    ],
  },
  {
    title: 'SDM',
    items: [
      { to: '/employees',    label: 'Karyawan',   icon: UserCheck },
      { to: '/hr/attendance',label: 'Absensi',    icon: Clock },
      { to: '/hr/shifts',    label: 'Jadwal Shift', icon: CalendarDays },
      { to: '/hr/payroll',   label: 'Penggajian', icon: DollarSign },
    ],
  },
  {
    title: 'ANALITIK',
    items: [
      { to: '/reports', label: 'Laporan', icon: BarChart3 },
    ],
  },
  {
    title: 'PENGATURAN',
    items: [
      { to: '/outlets',       label: 'Outlet',       icon: Building2 },
      { to: '/service-types', label: 'Jenis Layanan', icon: Tags },
      { to: '/settings',      label: 'Pengaturan',   icon: Settings },
    ],
  },
];

interface NotifItem {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Fetch unread notifications count
  const { data: notifs = [] } = useQuery<NotifItem[]>({
    queryKey: ['notifications-unread'],
    queryFn: () => apiGet('/notifications?limit=10&unread=true'),
    refetchInterval: 60_000,
  });
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  // Close notif dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() ?? '?';

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 text-sm">
          L
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-bold text-white text-base leading-tight whitespace-nowrap">Laundry24</span>
            <p className="text-[10px] text-sidebar-text/60 whitespace-nowrap">Management System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-1">
            {!collapsed && (
              <p className="nav-section-label">{group.title}</p>
            )}
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 mx-2 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-primary-600/30 text-white border-l-2 border-primary-400 ml-2 pl-2.5'
                      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
                  )
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className={clsx(
        'border-t border-white/5 flex-shrink-0',
        collapsed ? 'p-2' : 'p-4',
      )}>
        {collapsed ? (
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mx-auto">
            {avatarLetter}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className="inline-block mt-0.5 text-[10px] bg-primary-600/40 text-primary-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-white/10 rounded-lg text-sidebar-text hover:text-white transition-colors"
              title="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col bg-sidebar transition-all duration-300 flex-shrink-0',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* ── Mobile overlay sidebar ─────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col bg-sidebar w-72 z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-sidebar-text hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent collapsed={false} />
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-3 flex-shrink-0 z-10">
          {/* Desktop toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Notification bell with dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900">Notifikasi</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-primary-600 font-medium">{unreadCount} belum dibaca</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">Tidak ada notifikasi</div>
                  ) : (
                    notifs.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={clsx(
                          'px-4 py-3 hover:bg-gray-50 transition-colors',
                          !n.isRead && 'bg-primary-50/50',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                          )}
                          <div className={clsx(!n.isRead ? '' : 'ml-4')}>
                            <p className="text-sm font-medium text-gray-800 leading-tight">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Lihat semua notifikasi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {avatarLetter}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronRight size={14} className="text-gray-400 hidden md:block" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
