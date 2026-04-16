import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, FileText, Zap, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: 'Draft',    color: 'bg-gray-100 text-gray-600' },
  APPROVED: { label: 'Disetujui', color: 'bg-blue-100 text-blue-700' },
  PAID:     { label: 'Dibayar',  color: 'bg-green-100 text-green-700' },
};

const formatRp = (v: number | string) =>
  `Rp ${Number(v).toLocaleString('id-ID')}`;

export default function PayrollPage() {
  const qc = useQueryClient();
  const now = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(now.month() + 1);
  const [selectedYear, setSelectedYear]   = useState(now.year());

  const periodStart = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`).format('YYYY-MM-DD');
  const periodEnd   = dayjs(periodStart).endOf('month').format('YYYY-MM-DD');

  const { data: payrollData = [], isLoading } = useQuery<any[]>({
    queryKey: ['payroll', selectedMonth, selectedYear],
    queryFn: () => apiGet('/employees/payroll', { periodStart, periodEnd }),
    select: (d: any) => d?.data ?? d ?? [],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiPost('/employees/payroll/generate', { periodStart, periodEnd }),
    onSuccess: () => {
      toast.success('Penggajian berhasil digenerate');
      qc.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal generate penggajian'),
  });

  const totalPayroll = payrollData.reduce((acc: number, p: any) => acc + Number(p.netSalary ?? 0), 0);

  const years = Array.from({ length: 3 }, (_, i) => now.year() - i);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Penggajian</h1>
          <p className="page-subtitle">Kelola dan proses gaji karyawan</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast('Fitur export PDF dalam pengembangan', { icon: 'ℹ️' })}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} />
            Export PDF
          </button>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <Zap size={16} />
            {generateMutation.isPending ? 'Memproses...' : 'Generate Penggajian'}
          </button>
        </div>
      </div>

      {/* Period selector & summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card md:col-span-2 py-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="label">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="stat-card-icon bg-primary-100 text-primary-600">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Penggajian</p>
            <p className="text-xl font-bold text-gray-900">{formatRp(totalPayroll)}</p>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="stat-card-icon bg-purple-100 text-purple-600">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Jumlah Karyawan</p>
            <p className="text-xl font-bold text-gray-900">{payrollData.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-th">Karyawan</th>
              <th className="table-th">Jabatan</th>
              <th className="table-th">Hari Hadir</th>
              <th className="table-th">Gaji Pokok</th>
              <th className="table-th">Tunjangan</th>
              <th className="table-th">Potongan</th>
              <th className="table-th">Lembur</th>
              <th className="table-th">Total Gaji</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">Memuat data...</td>
              </tr>
            ) : payrollData.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <DollarSign className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-gray-400 text-sm">Belum ada data penggajian untuk periode ini</p>
                  <p className="text-gray-400 text-xs mt-1">Klik "Generate Penggajian" untuk membuat data</p>
                </td>
              </tr>
            ) : (
              payrollData.map((p: any) => {
                const stat = STATUS_CONFIG[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={p.id} className="table-row">
                    <td className="table-td">
                      <p className="font-medium">{p.employee?.user?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{p.employee?.employeeCode}</p>
                    </td>
                    <td className="table-td text-gray-500 text-xs">{p.employee?.position ?? '—'}</td>
                    <td className="table-td text-center">
                      <span className="font-medium">{p.presentDays}</span>
                      <span className="text-gray-400">/{p.workingDays}</span>
                    </td>
                    <td className="table-td">{formatRp(p.baseSalary)}</td>
                    <td className="table-td text-green-600">{formatRp(p.allowances)}</td>
                    <td className="table-td text-red-600">-{formatRp(p.deductions)}</td>
                    <td className="table-td text-blue-600">{formatRp(p.overtimePay)}</td>
                    <td className="table-td">
                      <span className="font-semibold">{formatRp(p.netSalary)}</span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${stat.color}`}>{stat.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {payrollData.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                  Total:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                  {formatRp(totalPayroll)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
