import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserX, Edit2, Users } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

const ROLES = [
  { value: 2, label: 'Admin' },
  { value: 3, label: 'Staff' },
  { value: 4, label: 'Driver' },
];

const emptyForm = {
  name: '', email: '', phone: '', password: '',
  roleId: 3, outletId: 1,
  position: '', hireDate: dayjs().format('YYYY-MM-DD'),
  baseSalary: 0, bankName: '', bankAccount: '',
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const { data: employees = [], isLoading } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: () => apiGet('/employees'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const { data: outlets = [] } = useQuery<any[]>({
    queryKey: ['outlets-list'],
    queryFn: () => apiGet('/outlets'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/employees', data),
    onSuccess: () => {
      toast.success('Karyawan berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan karyawan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiPatch(`/employees/${id}`, data),
    onSuccess: () => {
      toast.success('Data karyawan diperbarui');
      qc.invalidateQueries({ queryKey: ['employees'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/employees/${id}`),
    onSuccess: () => {
      toast.success('Karyawan dinonaktifkan');
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menonaktifkan'),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...emptyForm, outletId: outlets[0]?.id ?? 1 });
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditTarget(emp);
    setForm({
      name: emp.user?.name ?? '',
      phone: emp.user?.phone ?? '',
      position: emp.position ?? '',
      baseSalary: Number(emp.baseSalary),
      bankName: emp.bankName ?? '',
      bankAccount: emp.bankAccount ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleSubmit = () => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: form });
    } else {
      if (!form.name || !form.email || !form.password) {
        toast.error('Nama, email, dan password wajib diisi');
        return;
      }
      createMutation.mutate(form);
    }
  };

  const filtered = employees.filter((emp: any) =>
    emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
    emp.position?.toLowerCase().includes(search.toLowerCase())
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Karyawan</h1>
          <p className="page-subtitle">Kelola data karyawan dan akses sistem</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      {/* Search */}
      <div className="card py-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari nama, kode, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-th">Karyawan</th>
              <th className="table-th">Jabatan</th>
              <th className="table-th">Tanggal Masuk</th>
              <th className="table-th">Gaji Pokok</th>
              <th className="table-th">Status</th>
              <th className="table-th">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Memuat data...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Users className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-gray-400 text-sm">Belum ada data karyawan</p>
                  <p className="text-gray-400 text-xs mt-1">Klik "Tambah Karyawan" untuk menambahkan</p>
                </td>
              </tr>
            ) : (
              filtered.map((emp: any) => (
                <tr key={emp.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {emp.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emp.user?.name}</p>
                        <p className="text-xs text-gray-400">{emp.user?.email}</p>
                        <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-gray-600">{emp.position ?? '—'}</td>
                  <td className="table-td text-gray-500 text-sm">
                    {dayjs(emp.hireDate).format('DD MMM YYYY')}
                  </td>
                  <td className="table-td">
                    Rp {Number(emp.baseSalary).toLocaleString('id-ID')}
                  </td>
                  <td className="table-td">
                    <span className={clsx('badge', emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {emp.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      {emp.isActive && (
                        <button
                          onClick={() => {
                            if (confirm(`Nonaktifkan ${emp.user?.name}?`)) {
                              deactivateMutation.mutate(emp.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Nonaktifkan"
                        >
                          <UserX size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-gray-900">
                {editTarget ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Nama Lengkap *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
                </div>
                {!editTarget && (
                  <div className="form-group">
                    <label className="label">Email *</label>
                    <input type="email" className="input" value={form.email} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="label">No. HP</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
                </div>
                {!editTarget && (
                  <div className="form-group">
                    <label className="label">Password *</label>
                    <input type="password" className="input" value={form.password} onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="label">Jabatan</label>
                  <input className="input" value={form.position} onChange={(e) => setForm((f: any) => ({ ...f, position: e.target.value }))} placeholder="mis. Operator, Driver" />
                </div>
                {!editTarget && (
                  <div className="form-group">
                    <label className="label">Role</label>
                    <select className="input" value={form.roleId} onChange={(e) => setForm((f: any) => ({ ...f, roleId: Number(e.target.value) }))}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                )}
                {!editTarget && (
                  <div className="form-group">
                    <label className="label">Outlet</label>
                    <select className="input" value={form.outletId} onChange={(e) => setForm((f: any) => ({ ...f, outletId: Number(e.target.value) }))}>
                      {outlets.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                )}
                {!editTarget && (
                  <div className="form-group">
                    <label className="label">Tanggal Masuk</label>
                    <input type="date" className="input" value={form.hireDate} onChange={(e) => setForm((f: any) => ({ ...f, hireDate: e.target.value }))} />
                  </div>
                )}
                <div className="form-group">
                  <label className="label">Gaji Pokok (Rp)</label>
                  <input type="number" min="0" className="input" value={form.baseSalary} onChange={(e) => setForm((f: any) => ({ ...f, baseSalary: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="label">Nama Bank</label>
                  <input className="input" value={form.bankName} onChange={(e) => setForm((f: any) => ({ ...f, bankName: e.target.value }))} placeholder="mis. BCA, Mandiri" />
                </div>
                <div className="form-group">
                  <label className="label">No. Rekening</label>
                  <input className="input" value={form.bankAccount} onChange={(e) => setForm((f: any) => ({ ...f, bankAccount: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="btn-secondary">Batal</button>
              <button onClick={handleSubmit} disabled={isPending} className="btn-primary">
                {isPending ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah Karyawan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
