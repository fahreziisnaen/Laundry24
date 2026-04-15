import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { apiGet, apiPatch } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const NEXT_STATUS: Record<string, string> = {
  RECEIVED: 'WASHING',
  WASHING:  'IRONING',
  IRONING:  'DONE',
  DONE:     'DELIVERED',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiGet(`/orders/${id}`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiPatch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!order)   return <div className="p-6 text-gray-400">Order not found</div>;

  const o = order as any;
  const nextStatus = NEXT_STATUS[o.status];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{o.orderNumber}</h1>
          <p className="text-sm text-gray-400">{dayjs(o.createdAt).format('DD MMMM YYYY HH:mm')}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={o.status} />
          <StatusBadge status={o.paymentStatus} />
          {nextStatus && (
            <button
              onClick={() => statusMutation.mutate(nextStatus)}
              disabled={statusMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm py-1.5"
            >
              <CheckCircle size={14} /> Move to {nextStatus}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
          <p className="font-medium">{o.customer.name}</p>
          <p className="text-sm text-gray-500">{o.customer.phone}</p>
          {o.customer.email && <p className="text-sm text-gray-500">{o.customer.email}</p>}
        </div>

        {/* Order summary */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Summary</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Service</span><span>{o.serviceType.name}</span></div>
            {o.totalWeight && <div className="flex justify-between"><span className="text-gray-500">Weight</span><span>{o.totalWeight} kg</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>Rp {Number(o.subtotal).toLocaleString('id-ID')}</span></div>
            {Number(o.discountAmount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rp {Number(o.discountAmount).toLocaleString('id-ID')}</span></div>}
            <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Total</span><span>Rp {Number(o.totalAmount).toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paid</span><span>Rp {Number(o.paidAmount).toLocaleString('id-ID')}</span></div>
          </div>
        </div>
      </div>

      {/* Items */}
      {o.items?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Items</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500"><th className="pb-2">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {o.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2">{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>Rp {Number(item.unitPrice).toLocaleString('id-ID')}</td>
                  <td className="font-medium">Rp {Number(item.totalPrice).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status history */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Status History</h2>
        <div className="space-y-3">
          {o.statusHistory?.map((h: any) => (
            <div key={h.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={h.status} />
                  {h.user && <span className="text-xs text-gray-400">by {h.user.name}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{dayjs(h.createdAt).format('DD/MM/YY HH:mm')}</p>
                {h.notes && <p className="text-xs text-gray-600 mt-0.5">{h.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
