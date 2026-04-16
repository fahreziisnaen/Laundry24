import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

type ColorVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'orange';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: ColorVariant;
  onClick?: () => void;
}

const colorMap: Record<ColorVariant, { iconBg: string; iconColor: string; trendBg: string }> = {
  blue:   { iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   trendBg: 'bg-blue-50' },
  green:  { iconBg: 'bg-green-100',  iconColor: 'text-green-600',  trendBg: 'bg-green-50' },
  yellow: { iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', trendBg: 'bg-yellow-50' },
  red:    { iconBg: 'bg-red-100',    iconColor: 'text-red-600',    trendBg: 'bg-red-50' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trendBg: 'bg-purple-50' },
  teal:   { iconBg: 'bg-teal-100',   iconColor: 'text-teal-600',   trendBg: 'bg-teal-50' },
  orange: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trendBg: 'bg-orange-50' },
};

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
}: KpiCardProps) {
  const c = colorMap[color];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={clsx('stat-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('stat-card-icon', c.iconBg, c.iconColor)}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            isPositive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600',
          )}>
            {isPositive
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}

      {trend !== undefined && (
        <p className="text-xs text-gray-400 mt-2">
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          {' '}vs bulan lalu
        </p>
      )}
    </div>
  );
}
