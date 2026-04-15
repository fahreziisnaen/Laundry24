import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { get } from '../../services/api';

interface Order {
  id: number; orderNumber: string; status: string;
  totalAmount: number; createdAt: string;
  serviceType: { name: string };
  paymentStatus: string;
}

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: '#3B82F6', WASHING: '#06B6D4', IRONING: '#8B5CF6',
  DONE: '#22C55E', DELIVERED: '#6B7280', CANCELLED: '#EF4444',
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadOrders = async (p = 1) => {
    try {
      const res: any = await get('/orders', { page: p, limit: 20 });
      const newOrders = res.data ?? [];
      if (p === 1) setOrders(newOrders);
      else setOrders((prev) => [...prev, ...newOrders]);
      setHasMore(p < res.meta?.totalPages);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadOrders(1); }, []);

  const onRefresh = () => { setRefreshing(true); setPage(1); loadOrders(1); };
  const loadMore = () => { if (hasMore) { setPage(p => p + 1); loadOrders(page + 1); } };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={s.orderNum}>{item.orderNumber}</Text>
          <Text style={s.service}>{item.serviceType.name}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <View style={s.footer}>
        <Text style={s.amount}>Rp {Number(item.totalAmount).toLocaleString('id-ID')}</Text>
        <Text style={[s.payment, item.paymentStatus === 'PAID' ? s.paid : s.unpaid]}>{item.paymentStatus}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateOrder')} style={s.newBtn}>
          <Text style={s.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!loading ? <Text style={s.empty}>No orders found</Text> : null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title:     { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  newBtn:    { backgroundColor: '#1E3A5F', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText:{ color: '#fff', fontWeight: '600', fontSize: 13 },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderNum:  { fontWeight: '600', color: '#1E3A5F', fontSize: 13 },
  service:   { color: '#6B7280', fontSize: 12, marginTop: 2 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  amount:    { fontWeight: '600', color: '#111827' },
  payment:   { fontSize: 12, fontWeight: '500' },
  paid:      { color: '#22C55E' },
  unpaid:    { color: '#EF4444' },
  empty:     { textAlign: 'center', color: '#9CA3AF', padding: 40 },
});
