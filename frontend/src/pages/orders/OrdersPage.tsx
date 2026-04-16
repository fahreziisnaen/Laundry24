import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { apiGetPaginated } from '../../services/api';
import dayjs from 'dayjs';

const STATUS_OPTIONS = ['', 'RECEIVED', 'WASHING', 'IRONING', 'DONE', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status, page],
    queryFn: () => apiGetPaginated('/orders', { search: search || undefined, status: status || undefined, page, limit: 20 }),
  });

  const orders = data?.data ?? [];
  const meta   = data?.meta ?? {};

  const columns = [
    { key: 'orderNumber', header: 'Order #', render: (r: any) => <span className="font-mono text-xs font-medium text-brand">{r.orderNumber}</span> },
    { key: 'customer',    header: 'Customer',  render: (r: any) => <div><p className="font-medium text-sm">{r.customer.name}</p><p className="text-xs text-gray-400">{r.customer.phone}</p></div> },
    { key: 'serviceType', header: 'Service',   render: (r: any) => <span className="text-sm">{r.serviceType.name}</span> },
    { key: 'status',      header: 'Status',    render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'payment',     header: 'Payment',   render: (r: any) => <StatusBadge status={r.paymentStatus} /> },
    { key: 'total',       header: 'Total',     render: (r: any) => <span className="font-medium">Rp {Number(r.totalAmount).toLocaleString('id-ID')}</span> },
    { key: 'createdAt',   header: 'Date',      render: (r: any) => <span className="text-xs text-gray-500">{dayjs(r.createdAt).format('DD/MM/YY HH:mm')}</span> },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage laundry orders</p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input max-w-[180px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={isLoading}
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/orders/${r.id}`)}
      />
    </div>
  );
}
