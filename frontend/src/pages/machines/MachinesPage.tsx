import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Cpu, Wifi, WifiOff, Wrench, X, Radio } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';
import clsx from 'clsx';

dayjs.extend(relativeTime);
dayjs.locale('id');

type MachineStatus = 'IDLE' | 'RUNNING' | 'MAINTENANCE' | 'OFFLINE';
type MachineType = 'WASHER' | 'DRYER' | 'IRON';

const STATUS_CONFIG: Record<MachineStatus, { label: string; dot: string; badge: string }> = {
  IDLE:        { label: 'Tersedia',   dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  RUNNING:     { label: 'Digunakan',  dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { label: 'Maintenance',dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
  OFFLINE:     { label: 'Offline',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
};

const TYPE_LABELS: Record<MachineType, string> = {
  WASHER: 'Mesin Cuci',
  DRYER:  'Mesin Pengering',
  IRON:   'Setrika',
};

const TYPE_OPTIONS: MachineType[] = ['WASHER', 'DRYER', 'IRON'];

interface MachineForm {
  name: string;
  type: MachineType;
  capacityKg: string;
  nfcUid: string;
}

export default function MachinesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MachineForm>({
    name: '',
    type: 'WASHER',
    capacityKg: '',
    nfcUid: '',
  });

  const { data: machines = [], isLoading } = useQuery<any[]>({
    queryKey: ['machines'],
    queryFn: () => apiGet('/iot/machines'),
    refetchInterval: 30_000,
    select: (d: any) => d ?? [],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/iot/machines', data),
    onSuccess: () => {
      toast.success('Mesin berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['machines'] });
      setShowModal(false);
      setForm({ name: '', type: 'WASHER', capacityKg: '', nfcUid: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan mesin'),
  });

  const pingMutation = useMutation({
    mutationFn: (id: number) => apiPost(`/iot/machines/${id}/ping`),
    onSuccess: (_, id) => {
      toast.success(`Ping mesin #${id} berhasil`);
      qc.invalidateQueries({ queryKey: ['machines'] });
    },
    onError: () => toast.error('Gagal ping mesin'),
  });

  // Group by type
  const grouped: Record<string, any[]> = {};
  machines.forEach((m: any) => {
    if (!grouped[m.type]) grouped[m.type] = [];
    grouped[m.type].push(m);
  });

  const stats = {
    total:       machines.length,
    idle:        machines.filter((m: any) => m.status === 'IDLE').length,
    running:     machines.filter((m: any) => m.status === 'RUNNING').length,
    maintenance: machines.filter((m: any) => m.status === 'MAINTENANCE').length,
    offline:     machines.filter((m: any) => m.status === 'OFFLINE').length,
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Mesin</h1>
          <p className="page-subtitle">Monitor dan kelola mesin laundry (IoT)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Tambah Mesin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Mesin',  value: stats.total,       color: 'bg-gray-100 text-gray-600' },
          { label: 'Tersedia',     value: stats.idle,        color: 'bg-green-100 text-green-700' },
          { label: 'Digunakan',    value: stats.running,     color: 'bg-blue-100 text-blue-700' },
          { label: 'Offline/Maintenance', value: stats.offline + stats.maintenance, color: 'bg-red-100 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl px-4 py-3 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        <span>Status diperbarui setiap 30 detik</span>
      </div>

      {/* Machine cards by type */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Memuat data mesin...</div>
      ) : machines.length === 0 ? (
        <div className="text-center py-16">
          <Cpu className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500 font-medium">Belum ada mesin terdaftar</p>
          <p className="text-gray-400 text-sm mt-1">Tambahkan mesin laundry Anda</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, typeMs]) => (
          <div key={type}>
            <h2 className="section-title">{TYPE_LABELS[type as MachineType] ?? type}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {typeMs.map((machine: any) => {
                const sc = STATUS_CONFIG[machine.status as MachineStatus] ?? STATUS_CONFIG.OFFLINE;
                return (
                  <div key={machine.id} className="card p-5 relative">
                    {/* Status dot */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                    </div>

                    {/* Machine icon */}
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-3">
                      <Cpu size={24} className="text-primary-600" />
                    </div>

                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{machine.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[machine.type as MachineType]}</p>

                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Kapasitas</span>
                        <span className="font-medium">{machine.capacityKg} kg</span>
                      </div>
                      {machine.nfcUid && (
                        <div className="flex justify-between">
                          <span>NFC UID</span>
                          <span className="font-mono text-xs text-gray-500">{machine.nfcUid}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Ping terakhir</span>
                        <span className={clsx('font-medium', !machine.lastPingAt && 'text-gray-400')}>
                          {machine.lastPingAt ? dayjs(machine.lastPingAt).fromNow() : 'Belum pernah'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className={`badge ${sc.badge}`}>{sc.label}</span>
                      <button
                        onClick={() => pingMutation.mutate(machine.id)}
                        disabled={pingMutation.isPending}
                        className="btn-secondary btn-sm flex items-center gap-1.5"
                      >
                        <Radio size={12} />
                        Ping
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Add Machine Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold text-gray-900">Tambah Mesin Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Nama Mesin <span className="text-red-500">*</span></label>
                <input
                  className="input"
                  placeholder="Contoh: Mesin Cuci 1"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Tipe Mesin</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MachineType }))}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Kapasitas (kg) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="input"
                  placeholder="10"
                  min="1"
                  value={form.capacityKg}
                  onChange={(e) => setForm((f) => ({ ...f, capacityKg: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">NFC UID (opsional)</label>
                <input
                  className="input font-mono"
                  placeholder="04:xx:xx:xx:xx:xx:xx"
                  value={form.nfcUid}
                  onChange={(e) => setForm((f) => ({ ...f, nfcUid: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={() => createMutation.mutate({
                  name: form.name,
                  type: form.type,
                  capacityKg: Number(form.capacityKg),
                  nfcUid: form.nfcUid || undefined,
                })}
                disabled={!form.name || !form.capacityKg || createMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending ? 'Menyimpan...' : 'Tambah Mesin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
