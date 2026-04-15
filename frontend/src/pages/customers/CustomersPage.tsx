import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { apiGet } from '../../services/api';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => apiGet('/customers', { search: search || undefined, page, limit: 20 }),
  });

  const customers = (data as any)?.data ?? [];
  const meta = (data as any)?.meta ?? {};

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email', render: (r: any) => r.email ?? '—' },
    { key: 'orders', header: 'Orders', render: (r: any) => <span className="text-center">{r._count?.orders ?? 0}</span> },
    { key: 'wallet', header: 'Wallet', render: (r: any) => `Rp ${Number(r.walletBalance).toLocaleString('id-ID')}` },
    { key: 'points', header: 'Points', render: (r: any) => r.loyaltyPoints },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button onClick={() => navigate('/customers/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card py-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={isLoading}
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/customers/${r.id}`)}
      />
    </div>
  );
}
