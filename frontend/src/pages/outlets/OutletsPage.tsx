import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, ShoppingBag, Plus, Edit2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', address: '', phone: '', city: '' };

export default function OutletsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const { data: outlets = [], isLoading } = useQuery<any[]>({
    queryKey: ['outlets'],
    queryFn: () => apiGet('/outlets'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/outlets', data),
    onSuccess: () => {
      toast.success('Outlet berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['outlets'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan outlet'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiPatch(`/outlets/${id}`, data),
    onSuccess: () => {
      toast.success('Outlet berhasil diperbarui');
      qc.invalidateQueries({ queryKey: ['outlets'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui outlet'),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (outlet: any) => {
    setEditTarget(outlet);
    setForm({
      name: outlet.name ?? '',
      address: outlet.address ?? '',
      phone: outlet.phone ?? '',
      city: outlet.city ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleSubmit = () => {
    if (!form.name) { toast.error('Nama outlet wajib diisi'); return; }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Outlet</h1>
          <p className="page-subtitle">Kelola cabang dan lokasi laundry</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Outlet
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Memuat data...</div>
        ) : outlets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="mx-auto mb-2 text-gray-300" size={36} />
            <p className="text-gray-400 text-sm">Belum ada outlet</p>
          </div>
        ) : (
          outlets.map((outlet: any) => (
            <div key={outlet.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{outlet.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{outlet.city}</p>
                    <p className="text-xs text-gray-400">{outlet.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(outlet)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded flex-shrink-0"
                >
                  <Edit2 size={15} />
                </button>
              </div>
              {outlet.address && (
                <p className="text-xs text-gray-400 mt-3 line-clamp-2">{outlet.address}</p>
              )}
              <div className="mt-4 flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <span className="flex items-center gap-1">
                  <ShoppingBag size={12} />{outlet._count?.orders ?? 0} orders
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />{outlet._count?.employees ?? 0} staff
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                {editTarget ? 'Edit Outlet' : 'Tambah Outlet Baru'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="label">Nama Outlet *</label>
                <input className="input" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="mis. Laundry24 - Cabang Selatan" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Kota</label>
                  <input className="input" value={form.city} onChange={(e) => setForm((f: any) => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">No. Telepon</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Alamat Lengkap</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn-secondary">Batal</button>
              <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
                {isPending ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah Outlet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
