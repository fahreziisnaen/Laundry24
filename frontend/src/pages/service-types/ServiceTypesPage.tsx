import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Tags, ToggleLeft, ToggleRight } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const formatRp = (v: number | string) =>
  `Rp ${Number(v).toLocaleString('id-ID')}`;

interface ServiceTypeForm {
  name: string;
  code: string;
  basePrice: string;
  unit: string;
  slaHours: string;
}

const emptyForm: ServiceTypeForm = {
  name: '',
  code: '',
  basePrice: '',
  unit: 'kg',
  slaHours: '24',
};

export default function ServiceTypesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<any>(null);
  const [form, setForm]                 = useState<ServiceTypeForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: serviceTypes = [], isLoading } = useQuery<any[]>({
    queryKey: ['service-types-all'],
    queryFn: () => apiGet('/service-types?activeOnly=false'),
    select: (d: any) => d ?? [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/service-types', data),
    onSuccess: () => {
      toast.success('Jenis layanan berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['service-types-all'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menyimpan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPatch(`/service-types/${id}`, data),
    onSuccess: () => {
      toast.success('Jenis layanan berhasil diperbarui');
      qc.invalidateQueries({ queryKey: ['service-types-all'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/service-types/${id}`),
    onSuccess: () => {
      toast.success('Jenis layanan dinonaktifkan');
      qc.invalidateQueries({ queryKey: ['service-types-all'] });
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menonaktifkan'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiPatch(`/service-types/${id}`, { isActive }),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? 'Layanan diaktifkan' : 'Layanan dinonaktifkan');
      qc.invalidateQueries({ queryKey: ['service-types-all'] });
    },
    onError: () => toast.error('Gagal mengubah status'),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (st: any) => {
    setEditTarget(st);
    setForm({
      name:      st.name,
      code:      st.code,
      basePrice: String(st.basePrice),
      unit:      st.unit,
      slaHours:  String(st.slaHours),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(emptyForm);
  };

  const handleSubmit = () => {
    if (!form.name || !form.code || !form.basePrice) {
      toast.error('Nama, kode, dan harga wajib diisi');
      return;
    }
    const payload = {
      name:      form.name.trim(),
      code:      form.code.trim().toUpperCase(),
      basePrice: Number(form.basePrice),
      unit:      form.unit.trim() || 'kg',
      slaHours:  Number(form.slaHours) || 24,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Jenis Layanan</h1>
          <p className="page-subtitle">Kelola tipe layanan cuci, setrika, dan lainnya</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Tambah Layanan
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-th">Nama Layanan</th>
              <th className="table-th">Kode</th>
              <th className="table-th">Harga Dasar</th>
              <th className="table-th">Satuan</th>
              <th className="table-th">SLA (jam)</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">Memuat data...</td>
              </tr>
            ) : serviceTypes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Tags className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-gray-400 text-sm">Belum ada jenis layanan</p>
                </td>
              </tr>
            ) : (
              serviceTypes.map((st: any) => (
                <tr key={st.id} className="table-row">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{st.name}</p>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {st.code}
                    </span>
                  </td>
                  <td className="table-td font-medium">{formatRp(st.basePrice)}</td>
                  <td className="table-td text-gray-500">/{st.unit}</td>
                  <td className="table-td text-center text-gray-600">{st.slaHours}h</td>
                  <td className="table-td">
                    <button
                      onClick={() => toggleMutation.mutate({ id: st.id, isActive: !st.isActive })}
                      className="flex items-center gap-1.5 text-sm"
                      disabled={toggleMutation.isPending}
                    >
                      {st.isActive ? (
                        <>
                          <ToggleRight size={20} className="text-green-500" />
                          <span className="text-green-600 font-medium">Aktif</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} className="text-gray-400" />
                          <span className="text-gray-400">Nonaktif</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(st)}
                        className="p-1.5 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(st)}
                        className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold text-gray-900">
                {editTarget ? 'Edit Jenis Layanan' : 'Tambah Jenis Layanan'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="label">Nama Layanan <span className="text-red-500">*</span></label>
                  <input
                    className="input"
                    placeholder="Contoh: Cuci Reguler"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Kode <span className="text-red-500">*</span></label>
                  <input
                    className="input font-mono uppercase"
                    placeholder="REG"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Satuan</label>
                  <input
                    className="input"
                    placeholder="kg"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Harga Dasar (Rp) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className="input"
                    placeholder="5000"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">SLA (jam)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="24"
                    min="1"
                    value={form.slaHours}
                    onChange={(e) => setForm((f) => ({ ...f, slaHours: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn-secondary">Batal</button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Menyimpan...' : editTarget ? 'Perbarui' : 'Tambahkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold text-gray-900">Nonaktifkan Layanan?</h3>
              <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-gray-600">
                Yakin ingin menonaktifkan layanan <strong>{deleteConfirm.name}</strong>?
                Layanan ini tidak akan tampil saat membuat order baru.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Batal</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="btn-danger"
              >
                {deleteMutation.isPending ? 'Memproses...' : 'Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
