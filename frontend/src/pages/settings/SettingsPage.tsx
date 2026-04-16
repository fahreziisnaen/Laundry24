import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Building2, Globe, Eye, EyeOff, Save } from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Tab = 'profile' | 'outlet' | 'app';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const user = useAuthStore((s) => s.user);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profil',   icon: <User size={16} /> },
    { key: 'outlet',  label: 'Outlet',   icon: <Building2 size={16} /> },
    { key: 'app',     label: 'Aplikasi', icon: <Globe size={16} /> },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="page-title">Pengaturan</h1>
        <p className="page-subtitle">Kelola pengaturan akun dan aplikasi</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'outlet'  && <OutletTab user={user} />}
      {activeTab === 'app'     && <AppTab />}
    </div>
  );
}

/* ─────────────────────────────────── Profile Tab */
function ProfileTab({ user }: { user: any }) {
  const [form, setForm] = useState({
    name:  user?.name  ?? '',
    phone: user?.phone ?? '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiPatch('/users/me', data),
    onSuccess: () => toast.success('Profil berhasil diperbarui'),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui profil'),
  });

  const changePwMutation = useMutation({
    mutationFn: (data: any) => apiPost('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password berhasil diubah');
      setPwForm({ current: '', newPw: '', confirm: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal mengubah password'),
  });

  const handleChangePw = () => {
    if (!pwForm.current || !pwForm.newPw) { toast.error('Semua field password wajib diisi'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Password baru tidak cocok'); return; }
    if (pwForm.newPw.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    changePwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
  };

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="card space-y-4">
        <h2 className="section-title">Informasi Akun</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded font-medium uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label">Nama Lengkap</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="label">Nomor HP</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="form-group md:col-span-2">
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={user?.email ?? ''} disabled />
            <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={15} />
            {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h2 className="section-title">Ubah Password</h2>
        <div className="grid grid-cols-1 gap-4 max-w-sm">
          <div className="form-group">
            <label className="label">Password Saat Ini</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Password Baru</label>
            <input
              type="password"
              className="input"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
              placeholder="Min. 6 karakter"
            />
          </div>
          <div className="form-group">
            <label className="label">Konfirmasi Password Baru</label>
            <input
              type="password"
              className="input"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Ulangi password baru"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleChangePw}
            disabled={changePwMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {changePwMutation.isPending ? 'Memproses...' : 'Ubah Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Outlet Tab */
function OutletTab({ user }: { user: any }) {
  const outletId = user?.outletId;
  const { data: outlet } = useQuery<any>({
    queryKey: ['outlet-detail', outletId],
    queryFn: () => apiGet(`/outlets/${outletId}`),
    enabled: !!outletId,
  });

  const [form, setForm] = useState({
    name:    '',
    address: '',
    phone:   '',
    city:    '',
  });

  // Sync form when outlet loads
  useState(() => {
    if (outlet) {
      setForm({
        name:    outlet.name ?? '',
        address: outlet.address ?? '',
        phone:   outlet.phone ?? '',
        city:    outlet.city ?? '',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiPatch(`/outlets/${outletId}`, data),
    onSuccess: () => toast.success('Data outlet berhasil diperbarui'),
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui outlet'),
  });

  if (!outletId) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <Building2 className="mx-auto mb-2" size={32} />
        <p>Akun Anda tidak terhubung ke outlet manapun</p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <h2 className="section-title">Informasi Outlet</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group md:col-span-2">
          <label className="label">Nama Outlet</label>
          <input
            className="input"
            value={form.name || outlet?.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="label">Nomor Telepon</label>
          <input
            className="input"
            value={form.phone || outlet?.phone || ''}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="label">Kota</label>
          <input
            className="input"
            value={form.city || outlet?.city || ''}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div className="form-group md:col-span-2">
          <label className="label">Alamat Lengkap</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.address || outlet?.address || ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={15} />
          {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── App Tab */
function AppTab() {
  const [lang, setLang]         = useState('id');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [currency, setCurrency] = useState('IDR');

  return (
    <div className="card space-y-5">
      <h2 className="section-title">Preferensi Aplikasi</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="form-group">
          <label className="label">Bahasa</label>
          <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Zona Waktu</label>
          <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="Asia/Jakarta">WIB — Asia/Jakarta (GMT+7)</option>
            <option value="Asia/Makassar">WITA — Asia/Makassar (GMT+8)</option>
            <option value="Asia/Jayapura">WIT — Asia/Jayapura (GMT+9)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Format Mata Uang</label>
          <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="IDR">IDR — Rupiah (Rp)</option>
            <option value="USD">USD — US Dollar ($)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => toast.success('Preferensi disimpan')}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={15} />
          Simpan Preferensi
        </button>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tentang Aplikasi</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Versi</span>
            <span className="font-mono text-xs">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Nama Aplikasi</span>
            <span>Laundry24</span>
          </div>
        </div>
      </div>
    </div>
  );
}
