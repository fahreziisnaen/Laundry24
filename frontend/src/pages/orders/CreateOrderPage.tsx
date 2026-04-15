import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([]);
  const { register, handleSubmit, watch } = useForm();
  const selectedService = watch('serviceTypeId');

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiGet('/service-types'),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => apiGet('/customers', { limit: 100 }),
  });
  const customers = (customersData as any)?.data ?? [];
  const serviceList = (services as any)?.data ?? services;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/orders', data),
    onSuccess: (order: any) => {
      toast.success('Order created!');
      navigate(`/orders/${order.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create order'),
  });

  const addItem = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const onSubmit = (data: any) => {
    createMutation.mutate({
      customerId: parseInt(data.customerId),
      serviceTypeId: parseInt(data.serviceTypeId),
      totalWeight: data.totalWeight ? parseFloat(data.totalWeight) : undefined,
      items: items.length > 0 ? items : undefined,
      promoCode: data.promoCode || undefined,
      notes: data.notes || undefined,
    });
  };

  const selectedSvc = Array.isArray(serviceList) ? serviceList.find((s: any) => String(s.id) === String(selectedService)) : null;
  const isKiloan = selectedSvc?.code === 'KILOAN' || selectedSvc?.code === 'EXPRESS';

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-900">New Order</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card space-y-4">
          <h2 className="font-semibold">Order Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select {...register('customerId', { required: true })} className="input">
              <option value="">Select customer...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select {...register('serviceTypeId', { required: true })} className="input">
              <option value="">Select service...</option>
              {Array.isArray(serviceList) && serviceList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} — Rp {Number(s.basePrice).toLocaleString('id-ID')}/{s.unit}</option>
              ))}
            </select>
          </div>

          {isKiloan && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input {...register('totalWeight')} type="number" step="0.1" min="0.1" className="input" placeholder="3.5" />
            </div>
          )}

          {selectedSvc?.code === 'SATUAN' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Items</label>
                <button type="button" onClick={addItem} className="text-xs text-brand font-medium flex items-center gap-1">
                  <Plus size={12} /> Add Item
                </button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={item.name} onChange={e => setItems(items.map((it, idx) => idx === i ? {...it, name: e.target.value} : it))} placeholder="Item name" className="input flex-1" />
                  <input value={item.quantity} onChange={e => setItems(items.map((it, idx) => idx === i ? {...it, quantity: +e.target.value} : it))} type="number" min="1" className="input w-20" />
                  <input value={item.unitPrice} onChange={e => setItems(items.map((it, idx) => idx === i ? {...it, unitPrice: +e.target.value} : it))} type="number" min="0" className="input w-28" placeholder="Price" />
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
            <input {...register('promoCode')} className="input" placeholder="WELCOME10" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...register('notes')} className="input" rows={2} placeholder="Special instructions..." />
          </div>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary w-full py-3"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
}
