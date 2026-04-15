import clsx from 'clsx';

const statusConfig: Record<string, { label: string; class: string }> = {
  RECEIVED:  { label: 'Received',  class: 'bg-blue-100 text-blue-700' },
  WASHING:   { label: 'Washing',   class: 'bg-cyan-100 text-cyan-700' },
  IRONING:   { label: 'Ironing',   class: 'bg-purple-100 text-purple-700' },
  DONE:      { label: 'Done',      class: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Delivered', class: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
  UNPAID:    { label: 'Unpaid',    class: 'bg-red-100 text-red-700' },
  PARTIAL:   { label: 'Partial',   class: 'bg-yellow-100 text-yellow-700' },
  PAID:      { label: 'Paid',      class: 'bg-green-100 text-green-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, class: 'bg-gray-100 text-gray-700' };
  return (
    <span className={clsx('badge', config.class)}>
      {config.label}
    </span>
  );
}
