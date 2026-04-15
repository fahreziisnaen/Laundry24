import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ShoppingBag, Users, DollarSign, Clock } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import { apiGet } from '../../services/api';
import dayjs from 'dayjs';

interface DashboardData {
  today: { orders: number };
  month: { orders: number; revenue: number; revenueGrowth: number };
  active: { pendingOrders: number };
  customers: { total: number };
}

interface RevenuePoint { date: string; total: number }
interface OrderStat { status: string; _count: { id: number } }

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#3b82f6', WASHING: '#06b6d4', IRONING: '#8b5cf6',
  DONE: '#22c55e', DELIVERED: '#6b7280', CANCELLED: '#ef4444',
};

export default function DashboardPage() {
  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/reports/dashboard'),
  });

  const { data: revenue = [] } = useQuery<RevenuePoint[]>({
    queryKey: ['revenue'],
    queryFn: () => apiGet('/reports/revenue', { period: 'day' }),
  });

  const { data: orderStats = [] } = useQuery<OrderStat[]>({
    queryKey: ['orderStats'],
    queryFn: () => apiGet('/reports/orders/stats'),
  });

  const pieData = orderStats.map((s) => ({
    name: s.status,
    value: s._count.id,
    color: STATUS_COLORS[s.status],
  }));

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{dayjs().format('dddd, DD MMMM YYYY')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Orders Today"
          value={dashboard?.today.orders ?? 0}
          icon={<ShoppingBag size={20} />}
          color="blue"
        />
        <KpiCard
          title="Revenue This Month"
          value={formatCurrency(dashboard?.month.revenue ?? 0)}
          trend={dashboard?.month.revenueGrowth}
          icon={<DollarSign size={20} />}
          color="green"
        />
        <KpiCard
          title="Pending Orders"
          value={dashboard?.active.pendingOrders ?? 0}
          subtitle="In progress"
          icon={<Clock size={20} />}
          color="yellow"
        />
        <KpiCard
          title="Total Customers"
          value={dashboard?.customers.total ?? 0}
          icon={<Users size={20} />}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue area chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => dayjs(d).format('DD/MM')} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(d) => dayjs(d).format('DD MMM')} />
              <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Order Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
