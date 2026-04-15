import { useQuery } from '@tanstack/react-query';
import { Building2, Users, ShoppingBag } from 'lucide-react';
import { apiGet } from '../../services/api';

export default function OutletsPage() {
  const { data: outlets = [], isLoading } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => apiGet('/outlets'),
  });

  const list = Array.isArray(outlets) ? outlets : (outlets as any)?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading...</div>
        ) : list.map((outlet: any) => (
          <div key={outlet.id} className="card">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-accent/20 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-brand" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{outlet.name}</p>
                <p className="text-xs text-gray-400">{outlet.city}</p>
                <p className="text-xs text-gray-400 mt-0.5">{outlet.phone}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><ShoppingBag size={12} />{outlet._count?.orders ?? 0} orders</span>
              <span className="flex items-center gap-1"><Users size={12} />{outlet._count?.employees ?? 0} staff</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
