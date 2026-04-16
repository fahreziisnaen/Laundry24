import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, User, Phone, Mail, MapPin, Wallet, FileText } from 'lucide-react';
import { apiPost } from '../../services/api';
import toast from 'react-hot-toast';

interface CreateCustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  initialWallet: string;
  notes: string;
}

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
    initialWallet: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<CreateCustomerForm>>({});

  const mutation = useMutation({
    mutationFn: (data: any) => apiPost('/customers', data),
    onSuccess: (customer: any) => {
      toast.success(`Pelanggan "${form.name}" berhasil ditambahkan`);
      navigate(`/customers/${customer.id}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Gagal menambahkan pelanggan';
      toast.error(msg);
    },
  });

  const validate = () => {
    const e: Partial<CreateCustomerForm> = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
    else if (!/^[0-9+\-\s]{8,20}$/.test(form.phone.trim())) e.phone = 'Format nomor HP tidak valid';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
    if (form.initialWallet && isNaN(Number(form.initialWallet))) e.initialWallet = 'Harus berupa angka';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: any = {
      name: form.name.trim(),
      phone: form.phone.trim(),
    };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();
    // Initial wallet handled via topup after creation if needed
    mutation.mutate(payload);
  };

  const set = (field: keyof CreateCustomerForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pelanggan Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftarkan pelanggan baru ke sistem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="section-title">Informasi Dasar</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="form-group md:col-span-2">
              <label className="label">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={`input pl-9 ${errors.name ? 'input-error' : ''}`}
                  placeholder="Contoh: Budi Santoso"
                  value={form.name}
                  onChange={set('name')}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="label">
                Nomor HP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={`input pl-9 ${errors.phone ? 'input-error' : ''}`}
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                  placeholder="contoh@email.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="label">Alamat</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                className="input pl-9 resize-none"
                rows={2}
                placeholder="Jl. Contoh No. 123, Kota..."
                value={form.address}
                onChange={set('address')}
              />
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="card space-y-4">
          <h2 className="section-title">Informasi Tambahan</h2>

          {/* Initial wallet */}
          <div className="form-group">
            <label className="label">Saldo Awal Wallet (opsional)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Rp</div>
              <input
                type="number"
                className={`input pl-10 ${errors.initialWallet ? 'input-error' : ''}`}
                placeholder="0"
                min="0"
                value={form.initialWallet}
                onChange={set('initialWallet')}
              />
            </div>
            {errors.initialWallet && <p className="text-xs text-red-500 mt-1">{errors.initialWallet}</p>}
            <p className="text-xs text-gray-400 mt-1">Saldo dapat di-topup setelah pelanggan terdaftar</p>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="label">Catatan</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                className="input pl-9 resize-none"
                rows={3}
                placeholder="Catatan khusus tentang pelanggan..."
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <User size={16} />
                Tambah Pelanggan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
