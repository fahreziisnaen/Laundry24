import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../services/api';
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

export default function DeliveryPage() {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['delivery'],
    queryFn: () => apiGet('/delivery'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => apiPatch(`/delivery/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['delivery'] }); },
  });

  const list = Array.isArray(tasks) ? tasks : (tasks as any)?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Delivery Tasks</h1>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : list.map((task: any) => (
          <div key={task.id} className="card">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={clsx('badge', task.type === 'PICKUP' ? 'bg-cyan-100 text-cyan-700' : 'bg-purple-100 text-purple-700')}>
                    {task.type}
                  </span>
                  <span className={clsx('badge', statusColors[task.status])}>{task.status}</span>
                </div>
                <p className="mt-1 font-medium">{task.order?.orderNumber}</p>
                <p className="text-sm text-gray-600">{task.order?.customer?.name} — {task.order?.customer?.phone}</p>
                <p className="text-xs text-gray-400 mt-1">{task.address}</p>
                {task.scheduledAt && <p className="text-xs text-gray-400">Scheduled: {dayjs(task.scheduledAt).format('DD/MM HH:mm')}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {task.status === 'ASSIGNED' && (
                  <button onClick={() => updateMutation.mutate({ id: task.id, status: 'ON_WAY' })} className="btn-primary text-xs py-1.5">
                    Start
                  </button>
                )}
                {task.status === 'ON_WAY' && (
                  <button onClick={() => updateMutation.mutate({ id: task.id, status: 'DONE' })} className="btn-primary text-xs py-1.5 bg-green-600">
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
