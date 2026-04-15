import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { apiGet, api } from '../../services/api';
import dayjs from 'dayjs';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));

  const { data: revenue = [] } = useQuery({
    queryKey: ['revenue', dateFrom, dateTo],
    queryFn: () => apiGet('/reports/revenue', { dateFrom, dateTo }),
  });

  const { data: orderStats = [] } = useQuery({
    queryKey: ['orderStats', dateFrom, dateTo],
    queryFn: () => apiGet('/reports/orders/stats', { dateFrom, dateTo }),
  });

  const handleExportExcel = async () => {
    const res = await api.get('/reports/export/excel', {
      params: { dateFrom, dateTo },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `laundry24-${dayjs().format('YYYYMMDD')}.xlsx`;
    a.click();
  };

  const handleExportPdf = async () => {
    const res = await api.get('/reports/export/pdf', {
      params: { dateFrom, dateTo },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    window.open(url);
  };

  const revenueList = Array.isArray(revenue) ? revenue : (revenue as any)?.data ?? [];
  const statsList   = Array.isArray(orderStats) ? orderStats : (orderStats as any)?.data ?? [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short', currency: 'IDR', style: 'currency' }).format(v);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-40" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-40" />
          <button onClick={handleExportExcel} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> Excel
          </button>
          <button onClick={handleExportPdf} className="btn-primary flex items-center gap-2 text-sm">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue by Day</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueList}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => dayjs(d).format('DD/MM')} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
            <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} labelFormatter={d => dayjs(d).format('DD MMM')} />
            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Order stats table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Orders by Status</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400"><th className="pb-2">Status</th><th>Count</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {statsList.map((s: any) => (
              <tr key={s.status}>
                <td className="py-2 font-medium">{s.status}</td>
                <td>{s._count?.id ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
