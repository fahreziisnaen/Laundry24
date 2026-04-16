import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ShoppingBag, Users, Clock, DollarSign,
  UserCheck, AlertTriangle, ChevronRight, TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import clsx from 'clsx';

dayjs.locale('id');

const STATUS_COLORS: Record<string, string> = {
  RECEIVED:  '#3b82f6',
  WASHING:   '#06b6d4',
  IRONING:   '#8b5cf6',
  DONE:      '#22c55e',
  DELIVERED: '#6b7280',
  CANCELLED: '#ef4444',
};

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

interface KpiItem {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery<any>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/reports/dashboard'),
    refetchInterval: 60_000,
  });

  const { data: revenue = [] } = useQuery<any[]>({
    queryKey: ['revenue'],
    queryFn: () => apiGet('/reports/revenue', { period: 'day' }),
  });

  const { data: orderStats = [] } = useQuery<any[]>({
    queryKey: ['orderStats'],
    queryFn: () => apiGet('/reports/orders/stats'),
  });

  const { data: recentOrders = [] } = useQuery<any[]>({
    queryKey: ['recent-orders'],
    queryFn: () => apiGet('/orders', { limit: 10, page: 1 }),
    select: (d: any) => d?.data ?? [],
  });

  const { data: attendanceSummary } = useQuery<any>({
    queryKey: ['attendance-summary-dash'],
    queryFn: () => apiGet('/attendance/today-summary'),
  });

  const { data: inventoryLow = [] } = useQuery<any[]>({
    queryKey: ['inventory-low'],
    queryFn: () => apiGet('/inventory?lowStock=true&limit=5'),
    select: (d: any) => d?.data ?? [],
  });

  const pieData = orderStats.map((s: any) => ({
    name: s.status,
    value: s._count?.id ?? 0,
    color: STATUS_COLORS[s.status],
  }));

  const kpiItems: KpiItem[] = [
    {
      title: 'Omzet Hari Ini',
      value: formatRp(dashboard?.today?.revenue ?? 0),
      subtitle: 'Pendapatan hari ini',
      icon: <DollarSign size={22} />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: dashboard?.month?.revenueGrowth,
    },
    {
      title: 'Orders Masuk',
      value: dashboard?.today?.orders ?? 0,
      subtitle: 'Order hari ini',
      icon: <ShoppingBag size={22} />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Antrian Aktif',
      value: dashboard?.active?.pendingOrders ?? 0,
      subtitle: 'Sedang diproses',
      icon: <Clock size={22} />,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Pelanggan Baru',
      value: dashboard?.month?.newCustomers ?? 0,
      subtitle: 'Bulan ini',
      icon: <Users size={22} />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Karyawan Hadir',
      value: attendanceSummary?.present ?? 0,
      subtitle: 'Hadir hari ini',
      icon: <UserCheck size={22} />,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      title: 'Stok Menipis',
      value: inventoryLow.length,
      subtitle: 'Item perlu restock',
      icon: <AlertTriangle size={22} />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{dayjs().format('dddd, DD MMMM YYYY')}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* ── KPI row ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiItems.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`stat-card-icon ${kpi.iconBg} ${kpi.iconColor}`}>
                {kpi.icon}
              </div>
              {kpi.trend !== undefined && (
                <div className={clsx(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  kpi.trend >= 0 ? 'text-green-600' : 'text-red-600',
                )}>
                  <TrendingUp size={12} className={kpi.trend < 0 ? 'rotate-180' : ''} />
                  {Math.abs(kpi.trend)}%
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight truncate">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{kpi.title}</p>
            {kpi.subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{kpi.subtitle}</p>}
          </div>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue area chart */}
        <div className="card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Pendapatan 7 Hari Terakhir</h2>
              <p className="text-xs text-gray-400 mt-0.5">Omzet harian</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue.slice(-7)}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(d) => dayjs(d).format('DD/MM')}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: number) => [formatRp(v), 'Pendapatan']}
                labelFormatter={(d) => dayjs(d).format('DD MMM YYYY')}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0284c7"
                fill="url(#gradRevenue)"
                strokeWidth={2.5}
                dot={{ fill: '#0284c7', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Order</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={58}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
                  iconSize={8}
                  iconType="circle"
                />
                <Tooltip
                  formatter={(v, name) => [v, name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-gray-300">
              <ShoppingBag size={32} className="mb-2" />
              <p className="text-sm">Belum ada data</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: Recent orders ────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent orders table */}
        <div className="card p-0 overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Order Terbaru</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Lihat semua <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="table-th py-3">Order #</th>
                  <th className="table-th py-3">Pelanggan</th>
                  <th className="table-th py-3">Layanan</th>
                  <th className="table-th py-3">Status</th>
                  <th className="table-th py-3">Total</th>
                  <th className="table-th py-3">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                      Belum ada order
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="table-row cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="table-td">
                        <span className="font-mono text-xs text-primary-600 font-medium">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="table-td">
                        <p className="font-medium text-sm text-gray-800">{order.customer?.name}</p>
                        <p className="text-xs text-gray-400">{order.customer?.phone}</p>
                      </td>
                      <td className="table-td text-gray-600 text-sm">{order.serviceType?.name}</td>
                      <td className="table-td"><StatusBadge status={order.status} /></td>
                      <td className="table-td font-medium text-sm">
                        {formatRp(Number(order.totalAmount))}
                      </td>
                      <td className="table-td text-xs text-gray-400">
                        {dayjs(order.createdAt).format('HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock items */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Stok Menipis</h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Kelola <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {inventoryLow.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <AlertTriangle className="mx-auto mb-2 text-gray-300" size={24} />
                Semua stok aman
              </div>
            ) : (
              inventoryLow.map((item: any) => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      'text-sm font-semibold',
                      Number(item.stock) <= Number(item.minStock) * 0.5 ? 'text-red-600' : 'text-orange-500',
                    )}>
                      {Number(item.stock).toFixed(1)} {item.unit}
                    </p>
                    <p className="text-xs text-gray-400">min {Number(item.minStock).toFixed(1)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
