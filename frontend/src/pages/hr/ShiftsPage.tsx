import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

const COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

const EMPLOYEE_COLORS = new Map<number, string>();
let colorIdx = 0;
function getEmpColor(id: number) {
  if (!EMPLOYEE_COLORS.has(id)) {
    EMPLOYEE_COLORS.set(id, COLORS[colorIdx % COLORS.length]);
    colorIdx++;
  }
  return EMPLOYEE_COLORS.get(id)!;
}

export default function ShiftsPage() {
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(dayjs().startOf('week'));
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal]     = useState(false);

  // Add shift form
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '07:00', endTime: '15:00' });

  // Assign form
  const [assignForm, setAssignForm] = useState({ employeeId: '', shiftId: '', workDate: '' });

  const weekEnd = weekStart.endOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));

  const { data: shifts = [] } = useQuery<any[]>({
    queryKey: ['shifts'],
    queryFn: () => apiGet('/shifts'),
    select: (d: any) => d ?? [],
  });

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ['shift-assignments', weekStart.format('YYYY-MM-DD')],
    queryFn: () => apiGet('/shifts/assignments', {
      startDate: weekStart.format('YYYY-MM-DD'),
      endDate: weekEnd.format('YYYY-MM-DD'),
    }),
    select: (d: any) => d ?? [],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees-list'],
    queryFn: () => apiGet('/employees?limit=100'),
    select: (d: any) => d?.data ?? d ?? [],
  });

  const createShiftMutation = useMutation({
    mutationFn: (data: any) => apiPost('/shifts', data),
    onSuccess: () => {
      toast.success('Shift berhasil dibuat');
      qc.invalidateQueries({ queryKey: ['shifts'] });
      setShowAddShiftModal(false);
      setShiftForm({ name: '', startTime: '07:00', endTime: '15:00' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal membuat shift'),
  });

  const assignMutation = useMutation({
    mutationFn: (data: any) => apiPost('/shifts/assign', data),
    onSuccess: () => {
      toast.success('Shift berhasil ditugaskan');
      qc.invalidateQueries({ queryKey: ['shift-assignments'] });
      setShowAssignModal(false);
      setAssignForm({ employeeId: '', shiftId: '', workDate: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menugaskan shift'),
  });

  const getAssignmentsForDay = (date: dayjs.Dayjs) =>
    assignments.filter((a: any) => dayjs(a.workDate).isSame(date, 'day'));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal Shift</h1>
          <p className="page-subtitle">Atur jadwal kerja karyawan per minggu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddShiftModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={16} />
            Buat Shift
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <CalendarDays size={16} />
            Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Shift types */}
      {shifts.length > 0 && (
        <div className="card py-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Daftar Shift:</p>
          <div className="flex flex-wrap gap-2">
            {shifts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-gray-500">{s.startTime} – {s.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart((w) => w.subtract(1, 'week'))} className="btn-secondary btn-sm p-1.5">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {weekStart.format('DD MMM')} – {weekEnd.format('DD MMM YYYY')}
          </span>
          <button onClick={() => setWeekStart((w) => w.add(1, 'week'))} className="btn-secondary btn-sm p-1.5">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setWeekStart(dayjs().startOf('week'))}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Minggu ini
        </button>
      </div>

      {/* Calendar grid */}
      <div className="table-container overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="table-header">
            <tr>
              {weekDays.map((day) => (
                <th key={day.format('YYYY-MM-DD')} className="table-th text-center py-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {day.format('ddd')}
                  </p>
                  <p className={clsx(
                    'text-lg font-bold mt-0.5',
                    day.isSame(dayjs(), 'day') ? 'text-primary-600' : 'text-gray-800',
                  )}>
                    {day.format('D')}
                  </p>
                  <p className="text-xs text-gray-400">{day.format('MMM')}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map((day) => {
                const dayAssignments = getAssignmentsForDay(day);
                return (
                  <td
                    key={day.format('YYYY-MM-DD')}
                    className={clsx(
                      'align-top p-2 border-r border-gray-100 min-h-[120px]',
                      day.isSame(dayjs(), 'day') && 'bg-primary-50/30',
                    )}
                  >
                    <div className="space-y-1.5 min-h-[80px]">
                      {dayAssignments.length === 0 ? (
                        <div className="text-center py-4 text-gray-300 text-xs">—</div>
                      ) : (
                        dayAssignments.map((a: any) => {
                          const empId = a.employee?.id;
                          const colorClass = getEmpColor(empId);
                          return (
                            <div
                              key={a.id}
                              className={`text-xs p-1.5 rounded border ${colorClass} leading-tight`}
                            >
                              <p className="font-semibold truncate">
                                {a.employee?.user?.name ?? '—'}
                              </p>
                              <p className="opacity-75">
                                {a.shift?.name} · {a.shift?.startTime}–{a.shift?.endTime}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ─── Modal: Create Shift ─────────────────── */}
      {showAddShiftModal && (
        <div className="modal-overlay" onClick={() => setShowAddShiftModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold text-gray-900">Buat Shift Baru</h3>
              <button onClick={() => setShowAddShiftModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Nama Shift</label>
                <input
                  className="input"
                  placeholder="Contoh: Pagi, Siang, Malam"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Jam Mulai</label>
                  <input
                    type="time"
                    className="input"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Jam Selesai</label>
                  <input
                    type="time"
                    className="input"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAddShiftModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={() => createShiftMutation.mutate(shiftForm)}
                disabled={!shiftForm.name || createShiftMutation.isPending}
                className="btn-primary"
              >
                {createShiftMutation.isPending ? 'Menyimpan...' : 'Buat Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Assign Shift ─────────────────── */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-semibold text-gray-900">Tugaskan Shift</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Karyawan</label>
                <select
                  className="input"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm((f) => ({ ...f, employeeId: e.target.value }))}
                >
                  <option value="">Pilih karyawan...</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user?.name ?? emp.employeeCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Shift</label>
                <select
                  className="input"
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm((f) => ({ ...f, shiftId: e.target.value }))}
                >
                  <option value="">Pilih shift...</option>
                  {shifts.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} – {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  className="input"
                  value={assignForm.workDate}
                  onChange={(e) => setAssignForm((f) => ({ ...f, workDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={() => assignMutation.mutate({
                  employeeId: Number(assignForm.employeeId),
                  shiftId: Number(assignForm.shiftId),
                  workDate: assignForm.workDate,
                })}
                disabled={!assignForm.employeeId || !assignForm.shiftId || !assignForm.workDate || assignMutation.isPending}
                className="btn-primary"
              >
                {assignMutation.isPending ? 'Menyimpan...' : 'Tugaskan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
