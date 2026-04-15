import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjData, setAdjData] = useState({ type: 'IN', quantity: 0, notes: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiGet('/inventory'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ itemId, data }: any) => apiPost(`/inventory/${itemId}/adjust`, data),
    onSuccess: () => {
      toast.success('Stock updated');
      setAdjusting(null);
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed'),
  });

  const inventoryList = Array.isArray(items) ? items : (items as any)?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading...</div>
        ) : inventoryList.map((item: any) => {
          const isLow = Number(item.stock) <= Number(item.minStock);
          return (
            <div key={item.id} className={clsx('card', isLow && 'border-yellow-300')}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                </div>
                {isLow && <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{Number(item.stock).toFixed(1)}</p>
                  <p className="text-xs text-gray-400">{item.unit} (min: {Number(item.minStock)})</p>
                </div>
                <button
                  onClick={() => { setAdjusting(item.id); setAdjData({ type: 'IN', quantity: 0, notes: '' }); }}
                  className="text-xs btn-primary py-1.5 flex items-center gap-1"
                >
                  <Plus size={12} /> Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust modal */}
      {adjusting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900">Adjust Stock</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={adjData.type} onChange={e => setAdjData({...adjData, type: e.target.value})} className="input">
                <option value="IN">Stock In (+)</option>
                <option value="OUT">Stock Out (-)</option>
                <option value="ADJUSTMENT">Correction (=)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" min="0" step="0.1" value={adjData.quantity} onChange={e => setAdjData({...adjData, quantity: +e.target.value})} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={adjData.notes} onChange={e => setAdjData({...adjData, notes: e.target.value})} className="input" placeholder="Reason..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAdjusting(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={() => adjustMutation.mutate({ itemId: adjusting, data: adjData })} disabled={adjustMutation.isPending} className="flex-1 btn-primary py-2">
                {adjustMutation.isPending ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
