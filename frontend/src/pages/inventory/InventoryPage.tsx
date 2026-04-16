import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Package, Edit2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const CATEGORIES = ['DETERGENT', 'SOFTENER', 'PERFUME', 'PLASTIC', 'HANGER', 'OTHER'];

const emptyItemForm = {
  name: '', category: 'DETERGENT', unit: 'kg',
  stock: 0, minStock: 0, costPerUnit: 0, outletId: 1,
};

export default function InventoryPage() {
  const qc = useQueryClient();

  // Adjust stock modal
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjData, setAdjData] = useState({ type: 'IN', quantity: 0, notes: '' });

  // Add/Edit item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState<any>(emptyItemForm);

  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['inventory'],
    queryFn: () => apiGet('/inventory'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const { data: outlets = [] } = useQuery<any[]>({
    queryKey: ['outlets-list'],
    queryFn: () => apiGet('/outlets'),
    select: (d: any) => Array.isArray(d) ? d : (d?.data ?? []),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiPost('/inventory', data),
    onSuccess: () => {
      toast.success('Item berhasil ditambahkan');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setShowItemModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan item'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiPatch(`/inventory/${id}`, data),
    onSuccess: () => {
      toast.success('Item diperbarui');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setShowItemModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ itemId, data }: any) => apiPost(`/inventory/${itemId}/adjust`, data),
    onSuccess: () => {
      toast.success('Stok berhasil diperbarui');
      setAdjusting(null);
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal mengubah stok'),
  });

  const openCreate = () => {
    setEditItem(null);
    setItemForm({ ...emptyItemForm, outletId: outlets[0]?.id ?? 1 });
    setShowItemModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      minStock: Number(item.minStock),
      costPerUnit: Number(item.costPerUnit),
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = () => {
    if (!itemForm.name) { toast.error('Nama item wajib diisi'); return; }
    if (editItem) {
      updateItemMutation.mutate({ id: editItem.id, data: itemForm });
    } else {
      createItemMutation.mutate(itemForm);
    }
  };

  const isItemPending = createItemMutation.isPending || updateItemMutation.isPending;

  const lowCount = items.filter((i: any) => Number(i.stock) <= Number(i.minStock)).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventaris</h1>
          <p className="page-subtitle">Kelola stok bahan dan perlengkapan laundry</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      {/* Summary */}
      {lowCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-yellow-800">
          <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
          <span><strong>{lowCount} item</strong> memiliki stok di bawah minimum — perlu restock segera.</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Package className="mx-auto mb-2 text-gray-300" size={36} />
            <p className="text-gray-400 text-sm">Belum ada item inventaris</p>
            <p className="text-gray-400 text-xs mt-1">Klik "Tambah Item" untuk menambahkan</p>
          </div>
        ) : (
          items.map((item: any) => {
            const isLow = Number(item.stock) <= Number(item.minStock);
            return (
              <div key={item.id} className={clsx('card', isLow && 'border-yellow-300 bg-yellow-50/30')}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {isLow && <AlertTriangle size={15} className="text-yellow-500" />}
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className={clsx('text-2xl font-bold', isLow ? 'text-yellow-600' : 'text-gray-900')}>
                      {Number(item.stock).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">{item.unit} &nbsp;·&nbsp; min: {Number(item.minStock)}</p>
                  </div>
                  <button
                    onClick={() => { setAdjusting(item.id); setAdjData({ type: 'IN', quantity: 0, notes: '' }); }}
                    className="btn-secondary btn-sm flex items-center gap-1"
                  >
                    <Plus size={12} /> Sesuaikan
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Harga/unit: Rp {Number(item.costPerUnit).toLocaleString('id-ID')}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Adjust stock modal */}
      {adjusting && (
        <div className="modal-overlay" onClick={() => setAdjusting(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">Sesuaikan Stok</h3>
              <button onClick={() => setAdjusting(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="label">Tipe</label>
                <select value={adjData.type} onChange={(e) => setAdjData({ ...adjData, type: e.target.value })} className="input">
                  <option value="IN">Stok Masuk (+)</option>
                  <option value="OUT">Stok Keluar (-)</option>
                  <option value="ADJUSTMENT">Koreksi (=)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Jumlah</label>
                <input type="number" min="0" step="0.1" value={adjData.quantity} onChange={(e) => setAdjData({ ...adjData, quantity: +e.target.value })} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Keterangan</label>
                <input value={adjData.notes} onChange={(e) => setAdjData({ ...adjData, notes: e.target.value })} className="input" placeholder="Alasan penyesuaian..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setAdjusting(null)} className="btn-secondary">Batal</button>
              <button
                onClick={() => adjustMutation.mutate({ itemId: adjusting, data: adjData })}
                disabled={adjustMutation.isPending}
                className="btn-primary"
              >
                {adjustMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit item modal */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-gray-900">
                {editItem ? 'Edit Item' : 'Tambah Item Baru'}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group sm:col-span-2">
                  <label className="label">Nama Item *</label>
                  <input className="input" value={itemForm.name} onChange={(e) => setItemForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="mis. Deterjen Attack 1Kg" />
                </div>
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <select className="input" value={itemForm.category} onChange={(e) => setItemForm((f: any) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Satuan</label>
                  <input className="input" value={itemForm.unit} onChange={(e) => setItemForm((f: any) => ({ ...f, unit: e.target.value }))} placeholder="kg, liter, pcs..." />
                </div>
                {!editItem && (
                  <>
                    <div className="form-group">
                      <label className="label">Stok Awal</label>
                      <input type="number" min="0" step="0.1" className="input" value={itemForm.stock} onChange={(e) => setItemForm((f: any) => ({ ...f, stock: +e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Outlet</label>
                      <select className="input" value={itemForm.outletId} onChange={(e) => setItemForm((f: any) => ({ ...f, outletId: Number(e.target.value) }))}>
                        {outlets.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="label">Stok Minimum</label>
                  <input type="number" min="0" step="0.1" className="input" value={itemForm.minStock} onChange={(e) => setItemForm((f: any) => ({ ...f, minStock: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Harga per Satuan (Rp)</label>
                  <input type="number" min="0" className="input" value={itemForm.costPerUnit} onChange={(e) => setItemForm((f: any) => ({ ...f, costPerUnit: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowItemModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleItemSubmit} disabled={isItemPending} className="btn-primary">
                {isItemPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
