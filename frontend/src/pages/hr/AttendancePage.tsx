import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, UserCheck, UserX, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { apiGet, apiGetPaginated, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

type DateFilter = 'today' | 'week' | 'month';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'Hadir',    color: 'bg-green-100 text-green-700' },
  LATE:    { label: 'Terlambat',color: 'bg-yellow-100 text-yellow-700' },
  ABSENT:  { label: 'Absen',   color: 'bg-red-100 text-red-700' },
  LEAVE:   { label: 'Cuti',    color: 'bg-blue-100 text-blue-700' },
  HOLIDAY: { label: 'Libur',   color: 'bg-gray-100 text-gray-600' },
};

function getDateRange(filter: DateFilter) {
  const today = dayjs();
  if (filter === 'today') return { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') };
  if (filter === 'week') return { startDate: today.startOf('week').format('YYYY-MM-DD'), endDate: today.endOf('week').format('YYYY-MM-DD') };
  return { startDate: today.startOf('month').format('YYYY-MM-DD'), endDate: today.endOf('month').format('YYYY-MM-DD') };
}

export default function AttendancePage() {
  const qc = useQueryClient();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [employeeId, setEmployeeId] = useState('');
  const [page, setPage] = useState(1);

  const { startDate, endDate } = getDateRange(dateFilter);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', dateFilter, employeeId, page],
    queryFn: () => apiGetPaginated('/attendance', {
      startDate,
      endDate,
      ...(employeeId ? { employeeId: Number(employeeId) } : {}),
      page,
      limit: 20,
    }),
  });

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: () => apiGet('/attendance/today-summary'),
    refetchInterval: 30_000,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees-list'],
    queryFn: () => apiGet('/employees', { limit: 100 }),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const checkInMutation = useMutation({
    mutationFn: () => apiPost('/attendance/check-in', {}),
    onSuccess: () => {
      toast.success('Check-in berhasil');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal check-in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => apiPost('/attendance/check-out', {}),
    onSuccess: () => {
      toast.success('Check-out berhasil');
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal check-out'),
  });

  const records = attendanceData?.data ?? [];
  const meta    = attendanceData?.meta ?? {};
  const sum = summary as any;

  const calcDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return '—';
    const diff = dayjs(checkOut).diff(dayjs(checkIn), 'minute');
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}j ${m}m`;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Absensi Karyawan</h1>
          <p className="page-subtitle">{dayjs().format('dddd, DD MMMM YYYY')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            <LogIn size={16} />
            Check In
          </button>
          <button
            onClick={() => checkOutMutation.mutate()}
            disabled={checkOutMutation.isPending}
            className="btn-secondary flex items-center gap-2"
          >
            <LogOut size={16} />
            Check Out
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="stat-card-icon bg-green-100 text-green-600">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Hadir Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900">{sum?.present ?? 0}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="stat-card-icon bg-yellow-100 text-yellow-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Terlambat</p>
            <p className="text-2xl font-bold text-gray-900">{sum?.late ?? 0}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="stat-card-icon bg-red-100 text-red-600">
            <UserX size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tidak Hadir</p>
            <p className="text-2xl font-bold text-gray-900">{sum?.absent ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-col sm:flex-row gap-3">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {(['today', 'week', 'month'] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setDateFilter(f); setPage(1); }}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors',
                dateFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              {f === 'today' ? 'Hari Ini' : f === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
            </button>
          ))}
        </div>
        <select
          value={employeeId}
          onChange={(e) => { setEmployeeId(e.target.value); setPage(1); }}
          className="input max-w-[220px]"
        >
          <option value="">Semua Karyawan</option>
          {employees.map((emp: any) => (
            <option key={emp.id} value={emp.id}>
              {emp.user?.name ?? emp.employeeCode}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="table-th">Karyawan</th>
              <th className="table-th">Tanggal</th>
              <th className="table-th">Check-In</th>
              <th className="table-th">Check-Out</th>
              <th className="table-th">Durasi</th>
              <th className="table-th">Shift</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">Memuat data...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Clock className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-gray-400 text-sm">Tidak ada data absensi</p>
                </td>
              </tr>
            ) : (
              records.map((r: any) => {
                const stat = STATUS_LABELS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={r.id} className="table-row">
                    <td className="table-td font-medium">
                      {r.employee?.user?.name ?? r.employee?.employeeCode ?? '—'}
                    </td>
                    <td className="table-td text-gray-500">
                      {dayjs(r.checkInAt).format('DD/MM/YYYY')}
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-sm">{dayjs(r.checkInAt).format('HH:mm')}</span>
                    </td>
                    <td className="table-td">
                      {r.checkOutAt ? (
                        <span className="font-mono text-sm">{dayjs(r.checkOutAt).format('HH:mm')}</span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Belum checkout</span>
                      )}
                    </td>
                    <td className="table-td text-gray-600">
                      {calcDuration(r.checkInAt, r.checkOutAt)}
                    </td>
                    <td className="table-td text-gray-500 text-xs">
                      {r.shift ? `${r.shift.name} (${r.shift.startTime}–${r.shift.endTime})` : '—'}
                    </td>
                    <td className="table-td">
                      <span className={`badge ${stat.color}`}>{stat.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total {meta.total} data</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="px-3 py-1.5 text-sm">
              Hal {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
