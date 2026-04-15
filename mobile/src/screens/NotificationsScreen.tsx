import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { get, post } from '../services/api';
import dayjs from 'dayjs';

interface Notif { id: number; title: string; body: string; type: string; isRead: boolean; createdAt: string; }

const TYPE_ICON: Record<string, string> = {
  ORDER_STATUS: '📦', PROMO: '🎁', REMINDER: '⏰', SYSTEM: '⚙️',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res: any = await get('/notifications/unread');
      setNotifications(Array.isArray(res) ? res : res?.data ?? []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async () => {
    try { await post('/notifications/mark-read'); load(); } catch {}
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markRead}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text style={s.emptyText}>No notifications</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[s.card, !item.isRead && s.cardUnread]}>
            <Text style={{ fontSize: 22 }}>{TYPE_ICON[item.type] ?? '📢'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.notifTitle}>{item.title}</Text>
              <Text style={s.notifBody}>{item.body}</Text>
              <Text style={s.notifTime}>{dayjs(item.createdAt).format('DD MMM HH:mm')}</Text>
            </View>
            {!item.isRead && <View style={s.dot} />}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title:     { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  markAll:   { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },
  card:      { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.04, elevation: 1 },
  cardUnread:{ borderLeftWidth: 3, borderLeftColor: '#1E3A5F' },
  notifTitle:{ fontWeight: '600', color: '#111827', fontSize: 14 },
  notifBody: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  notifTime: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E3A5F', marginTop: 4 },
  empty:     { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
});
