import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet } from 'lucide-react';
import { apiGet } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import dayjs from 'dayjs';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => apiGet(`/customers/${id}`),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!customer) return <div className="p-6 text-gray-400">Not found</div>;

  const c = customer as any;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-900">{c.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card md:col-span-2">
          <h2 className="font-semibold mb-3">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-400">Phone</p><p className="font-medium">{c.phone}</p></div>
            <div><p className="text-gray-400">Email</p><p className="font-medium">{c.email ?? '—'}</p></div>
            <div><p className="text-gray-400">Address</p><p className="font-medium">{c.address ?? '—'}</p></div>
            <div><p className="text-gray-400">Loyalty Points</p><p className="font-medium">{c.loyaltyPoints}</p></div>
          </div>
        </div>

        <div className="card bg-brand text-white">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} />
            <span className="font-semibold">Wallet</span>
          </div>
          <p className="text-2xl font-bold">Rp {Number(c.walletBalance).toLocaleString('id-ID')}</p>
          <button className="mt-3 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium">Top Up</button>
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <h2 className="font-semibold mb-3">Recent Orders</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-400 text-xs"><th className="pb-2">Order #</th><th>Service</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {c.orders?.map((o: any) => (
              <tr key={o.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/orders/${o.id}`)}>
                <td className="py-2 font-mono text-xs text-brand">{o.orderNumber}</td>
                <td>{o.serviceType.name}</td>
                <td><StatusBadge status={o.status} /></td>
                <td>Rp {Number(o.totalAmount).toLocaleString('id-ID')}</td>
                <td className="text-gray-400">{dayjs(o.createdAt).format('DD/MM/YY')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
