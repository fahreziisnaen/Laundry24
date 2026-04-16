import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import dayjs from 'dayjs';

const statusColors: Record<string, string> = {
  PENDING:  'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  ON_WAY:   'bg-yellow-100 text-yellow-700',
  DONE:     'bg-green-100 text-green-700',
  FAILED:   'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu', ASSIGNED: 'Ditugaskan', ON_WAY: 'Di Jalan', DONE: 'Selesai', FAILED: 'Gagal',
};

const emptyForm = { orderId: '', type: 'DELIVERY', address: '', scheduledAt: '' };

export default function DeliveryPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ['delivery'],
    queryFn: () => apiGet('/delivery'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['orders-for-delivery'],
    queryFn: () => apiGet('/orders', { limit: 100, status: 'DONE' }),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/delivery', {
      ...data,
      orderId: Number(data.orderId),
      scheduledAt: data.scheduledAt || undefined,
    }),
    onSuccess: () => {
      toast.success('Task pengiriman dibuat');
      qc.invalidateQueries({ queryKey: ['delivery'] });
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal membuat task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiPatch(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status diperbarui');
      qc.invalidateQueries({ queryKey: ['delivery'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal update status'),
  });

  const handleSubmit = () => {
    if (!form.orderId || !form.address) { toast.error('Order dan alamat wajib diisi'); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengiriman & Pickup</h1>
          <p className="page-subtitle">Kelola tugas pengiriman dan penjemputan laundry</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Buat Task
        </button>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Memuat data...</div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-16">
            <Truck className="mx-auto mb-2 text-gray-300" size={36} />
            <p className="text-gray-400 text-sm">Belum ada task pengiriman</p>
          </div>
        ) : (
          tasks.map((task: any) => (
            <div key={task.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('badge', task.type === 'PICKUP' ? 'bg-cyan-100 text-cyan-700' : 'bg-purple-100 text-purple-700')}>
                      {task.type === 'PICKUP' ? 'Pickup' : 'Pengiriman'}
                    </span>
                    <span className={clsx('badge', statusColors[task.status])}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </div>
                  <p className="mt-1.5 font-medium text-gray-900">
                    {task.order?.orderNumber ?? `Order #${task.orderId}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {task.order?.customer?.name} &mdash; {task.order?.customer?.phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{task.address}</p>
                  {task.scheduledAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Dijadwalkan: {dayjs(task.scheduledAt).format('DD/MM/YYYY HH:mm')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: task.id, status: 'ASSIGNED' })}
                      className="btn-secondary btn-sm"
                    >
                      Tugaskan
                    </button>
                  )}
                  {task.status === 'ASSIGNED' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: task.id, status: 'ON_WAY' })}
                      className="btn-primary btn-sm"
                    >
                      Mulai Perjalanan
                    </button>
                  )}
                  {task.status === 'ON_WAY' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: task.id, status: 'DONE' })}
                      className="btn-primary btn-sm bg-green-600 hover:bg-green-700"
                    >
                      Selesai
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">Buat Task Pengiriman</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="label">Order *</label>
                <select className="input" value={form.orderId} onChange={(e) => setForm((f: any) => ({ ...f, orderId: e.target.value }))}>
                  <option value="">-- Pilih Order --</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Tipe</label>
                <select className="input" value={form.type} onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                  <option value="PICKUP">Pickup (Jemput dari pelanggan)</option>
                  <option value="DELIVERY">Pengiriman (Antar ke pelanggan)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Alamat *</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))}
                  placeholder="Alamat lengkap..."
                />
              </div>
              <div className="form-group">
                <label className="label">Jadwal (opsional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f: any) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Membuat...' : 'Buat Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
