import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth.store';
import { get } from '../services/api';

interface Order {
  id: number; orderNumber: string; status: string; totalAmount: number;
  createdAt: string; serviceType: { name: string };
}

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: '#3B82F6', WASHING: '#06B6D4', IRONING: '#8B5CF6',
  DONE: '#22C55E', DELIVERED: '#6B7280', CANCELLED: '#EF4444',
};

export default function HomeScreen() {
  const { customer } = useAuthStore();
  const navigation = useNavigation<any>();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await get<{ data: Order[] }>('/orders', { limit: 5 });
      setRecentOrders((res as any).data ?? []);
    } catch {}
  };

  useEffect(() => { loadOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {customer?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.subtitle}>Track your laundry with ease</Text>
        </View>
        <View style={s.walletBadge}>
          <Text style={s.walletLabel}>Wallet</Text>
          <Text style={s.walletAmount}>Rp {Number(customer?.walletBalance ?? 0).toLocaleString('id-ID')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate('CreateOrder')}
        >
          <Text style={s.actionIcon}>➕</Text>
          <Text style={s.actionLabel}>New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Orders')}>
          <Text style={s.actionIcon}>📦</Text>
          <Text style={s.actionLabel}>My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={s.actionIcon}>🔔</Text>
          <Text style={s.actionLabel}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={s.actionIcon}>👤</Text>
          <Text style={s.actionLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Orders */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Recent Orders</Text>
        {recentOrders.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No orders yet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateOrder')}>
              <Text style={s.emptyLink}>Create your first order →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={s.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { id: order.id })}
            >
              <View style={[s.statusDot, { backgroundColor: STATUS_COLOR[order.status] ?? '#9CA3AF' }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.orderNumber}>{order.orderNumber}</Text>
                <Text style={s.orderService}>{order.serviceType.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLOR[order.status]}20` }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[order.status] }]}>{order.status}</Text>
                </View>
                <Text style={s.orderTotal}>Rp {Number(order.totalAmount).toLocaleString('id-ID')}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:     { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  walletBadge:  { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center' },
  walletLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  walletAmount: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  actions:      { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actionBtn:    { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#F9FAFB', borderRadius: 12 },
  actionIcon:   { fontSize: 22 },
  actionLabel:  { fontSize: 11, color: '#374151', marginTop: 4, fontWeight: '500' },
  section:      { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  orderCard:    { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  orderNumber:  { fontSize: 13, fontWeight: '600', color: '#111827' },
  orderService: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:   { fontSize: 10, fontWeight: '600' },
  orderTotal:   { fontSize: 12, color: '#374151', marginTop: 4, fontWeight: '500' },
  empty:        { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText:    { color: '#9CA3AF', fontSize: 14 },
  emptyLink:    { color: '#1E3A5F', fontSize: 13, fontWeight: '600', marginTop: 8 },
});
