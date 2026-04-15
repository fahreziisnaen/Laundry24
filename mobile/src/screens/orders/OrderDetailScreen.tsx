import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { get } from '../../services/api';
import dayjs from 'dayjs';

const STATUS_STEPS = ['RECEIVED', 'WASHING', 'IRONING', 'DONE', 'DELIVERED'];
const STATUS_COLOR: Record<string, string> = {
  RECEIVED: '#3B82F6', WASHING: '#06B6D4', IRONING: '#8B5CF6', DONE: '#22C55E', DELIVERED: '#6B7280',
};

export default function OrderDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setOrder(await get(`/orders/${id}`)); }
      catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <View style={s.center}><Text>Loading...</Text></View>;
  if (!order)  return <View style={s.center}><Text>Order not found</Text></View>;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={{ color: '#fff', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.orderNum}>{order.orderNumber}</Text>
        <Text style={s.date}>{dayjs(order.createdAt).format('DD MMMM YYYY')}</Text>
      </View>

      {/* Progress tracker */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Order Progress</Text>
        <View style={s.steps}>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <View key={step} style={s.step}>
                <View style={[s.stepDot, done && { backgroundColor: STATUS_COLOR[step] ?? '#22C55E' }, active && s.activeDot]} />
                {i < STATUS_STEPS.length - 1 && (
                  <View style={[s.stepLine, done && i < currentStep && { backgroundColor: '#22C55E' }]} />
                )}
                <Text style={[s.stepLabel, done && { color: STATUS_COLOR[step] }]}>{step}</Text>
              </View>
            );
          })}
        </View>
        {order.estimatedDoneAt && (
          <Text style={s.eta}>Estimated ready: {dayjs(order.estimatedDoneAt).format('DD MMM HH:mm')}</Text>
        )}
      </View>

      {/* Summary */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Summary</Text>
        {[
          ['Service', order.serviceType?.name],
          ['Weight', order.totalWeight ? `${order.totalWeight} kg` : null],
          ['Subtotal', `Rp ${Number(order.subtotal).toLocaleString('id-ID')}`],
          order.discountAmount > 0 ? ['Discount', `-Rp ${Number(order.discountAmount).toLocaleString('id-ID')}`] : null,
          ['Total', `Rp ${Number(order.totalAmount).toLocaleString('id-ID')}`],
        ].filter(Boolean).map(([label, value]) => value && (
          <View key={label} style={s.row}>
            <Text style={s.rowLabel}>{label}</Text>
            <Text style={s.rowValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      {order.notes && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Notes</Text>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>{order.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { backgroundColor: '#1E3A5F', padding: 20, paddingTop: 50 },
  back:        { marginBottom: 8 },
  orderNum:    { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  date:        { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card:        { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle:{ fontWeight: '600', color: '#111827', marginBottom: 12, fontSize: 15 },
  steps:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  step:        { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot:     { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D1D5DB', marginBottom: 6 },
  activeDot:   { width: 16, height: 16, borderRadius: 8, marginBottom: 4 },
  stepLine:    { position: 'absolute', top: 6, left: '50%', right: '-50%', height: 2, backgroundColor: '#D1D5DB' },
  stepLabel:   { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  eta:         { marginTop: 12, textAlign: 'center', fontSize: 12, color: '#6B7280' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  rowLabel:    { color: '#6B7280', fontSize: 13 },
  rowValue:    { color: '#111827', fontSize: 13, fontWeight: '500' },
});
