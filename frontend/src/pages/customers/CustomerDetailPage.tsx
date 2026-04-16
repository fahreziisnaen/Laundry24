import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wallet, X, ShoppingBag, CreditCard, Plus } from 'lucide-react';
import { apiGet, apiPost } from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import clsx from 'clsx';

type Tab = 'orders' | 'wallet';

const WALLET_TXN_TYPES: Record<string, { label: string; color: string }> = {
  TOPUP:  { label: 'Top Up',  color: 'text-green-600' },
  DEDUCT: { label: 'Debet',   color: 'text-red-600' },
  REFUND: { label: 'Refund',  color: 'text-blue-600' },
};

const formatRp = (v: number | string) =>
  `Rp ${Number(v).toLocaleString('id-ID')}`;

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpForm, setTopUpForm] = useState({ amount: '', notes: '' });

  const { data: customer, isLoading } = useQuery<any>({
    queryKey: ['customer', id],
    queryFn: () => apiGet(`/customers/${id}`),
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['customer-history', id],
    queryFn: () => apiGet(`/customers/${id}/history`),
    enabled: activeTab === 'wallet',
    select: (d: any) => d ?? [],
  });

  const topUpMutation = useMutation({
    mutationFn: (data: any) => apiPost(`/customers/${id}/wallet/topup`, data),
    onSuccess: (res: any) => {
      toast.success(`Top-up ${formatRp(Number(topUpForm.amount))} berhasil`);
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customer-history', id] });
      setShowTopUp(false);
      setTopUpForm({ amount: '', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal top-up'),
  });

  const handleTopUp = () => {
    const amount = Number(topUpForm.amount);
    if (!amount || amount <= 0) { toast.error('Jumlah top-up harus lebih dari 0'); return; }
    topUpMutation.mutate({ amount, reference: topUpForm.notes || undefined });
  };

  if (isLoading) return (
    <div className="p-6 flex items-center justify-center min-h-40 text-gray-400">
      Memuat data pelanggan...
    </div>
  );
  if (!customer) return (
    <div className="p-6 text-gray-400">Pelanggan tidak ditemukan</div>
  );

  const c = customer as any;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{c.name}</h1>
          <p className="text-sm text-gray-400">{c.phone}</p>
        </div>
      </div>

      {/* Profile + Wallet cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile */}
        <div className="card md:col-span-2 space-y-3">
          <h2 className="section-title">Profil Pelanggan</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Nomor HP</p>
              <p className="font-medium">{c.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="font-medium">{c.email ?? '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Alamat</p>
              <p className="font-medium">{c.address ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Poin Loyalitas</p>
              <p className="font-medium text-primary-600">{c.loyaltyPoints} poin</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Order</p>
              <p className="font-medium">{c.orders?.length ?? 0} order</p>
            </div>
            {c.notes && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Catatan</p>
                <p className="text-sm text-gray-600">{c.notes}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Terdaftar</p>
              <p className="font-medium">{dayjs(c.createdAt).format('DD MMMM YYYY')}</p>
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <div className="rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} />
            <span className="font-semibold text-sm">Wallet Saldo</span>
          </div>
          <p className="text-3xl font-bold mt-2">{formatRp(c.walletBalance)}</p>
          <div className="mt-auto pt-5">
            <button
              onClick={() => setShowTopUp(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Top Up Saldo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'orders' as Tab, label: 'Riwayat Order', icon: <ShoppingBag size={14} /> },
          { key: 'wallet' as Tab, label: 'Riwayat Wallet', icon: <CreditCard size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-th">Order #</th>
                <th className="table-th">Layanan</th>
                <th className="table-th">Status</th>
                <th className="table-th">Pembayaran</th>
                <th className="table-th">Total</th>
                <th className="table-th">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {!c.orders || c.orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    Belum ada order
                  </td>
                </tr>
              ) : (
                c.orders.map((o: any) => (
                  <tr
                    key={o.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <td className="table-td">
                      <span className="font-mono text-xs text-primary-600 font-medium">{o.orderNumber}</span>
                    </td>
                    <td className="table-td text-sm text-gray-700">{o.serviceType?.name}</td>
                    <td className="table-td"><StatusBadge status={o.status} /></td>
                    <td className="table-td"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="table-td font-medium">{formatRp(o.totalAmount)}</td>
                    <td className="table-td text-xs text-gray-400">
                      {dayjs(o.createdAt).format('DD/MM/YY')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Wallet transactions */}
      {activeTab === 'wallet' && (
        <div className="table-container">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-th">Tanggal</th>
                <th className="table-th">Tipe</th>
                <th className="table-th">Jumlah</th>
                <th className="table-th">Saldo Akhir</th>
                <th className="table-th">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    Belum ada transaksi wallet
                  </td>
                </tr>
              ) : (
                history.map((txn: any) => {
                  const tc = WALLET_TXN_TYPES[txn.type] ?? { label: txn.type, color: 'text-gray-600' };
                  return (
                    <tr key={txn.id} className="table-row">
                      <td className="table-td text-xs text-gray-500">
                        {dayjs(txn.createdAt).format('DD/MM/YY HH:mm')}
                      </td>
                      <td className="table-td">
                        <span className={`text-sm font-medium ${tc.color}`}>{tc.label}</span>
                      </td>
                      <td className={`table-td font-semibold text-sm ${tc.color}`}>
                        {txn.type === 'DEDUCT' ? '-' : '+'}{formatRp(txn.amount)}
                      </td>
                      <td className="table-td font-medium text-sm">
                        {formatRp(txn.balanceAfter)}
                      </td>
                      <td className="table-td text-xs text-gray-400">
                        {txn.reference ?? txn.notes ?? '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUp && (
        <div className="modal-overlay" onClick={() => setShowTopUp(false)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Wallet size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Top Up Wallet</h3>
              </div>
              <button onClick={() => setShowTopUp(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="bg-primary-50 rounded-xl p-3 mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Saldo saat ini</span>
                <span className="font-bold text-primary-700">{formatRp(c.walletBalance)}</span>
              </div>
              <div className="form-group">
                <label className="label">Jumlah Top Up (Rp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <input
                    type="number"
                    className="input pl-10 text-lg font-medium"
                    placeholder="50000"
                    min="1"
                    value={topUpForm.amount}
                    onChange={(e) => setTopUpForm((f) => ({ ...f, amount: e.target.value }))}
                    autoFocus
                  />
                </div>
              </div>
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpForm((f) => ({ ...f, amount: String(amt) }))}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                      topUpForm.amount === String(amt)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-primary-300',
                    )}
                  >
                    +{formatRp(amt)}
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="label">Keterangan (opsional)</label>
                <input
                  className="input"
                  placeholder="Contoh: Top up tunai"
                  value={topUpForm.notes}
                  onChange={(e) => setTopUpForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowTopUp(false)} className="btn-secondary">Batal</button>
              <button
                onClick={handleTopUp}
                disabled={!topUpForm.amount || topUpMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {topUpMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Wallet size={15} />
                    Konfirmasi Top Up
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
