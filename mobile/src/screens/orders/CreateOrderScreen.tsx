import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { get, post } from '../../services/api';

interface ServiceType { id: number; name: string; code: string; basePrice: number; unit: string; slaHours: number; }

export default function CreateOrderScreen() {
  const navigation = useNavigation<any>();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [selectedSvc, setSelectedSvc] = useState<ServiceType | null>(null);
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    get<any>('/service-types').then((res: any) => setServices(res?.data ?? res ?? [])).catch(() => {});
  }, []);

  const isKiloan = selectedSvc?.code === 'KILOAN' || selectedSvc?.code === 'EXPRESS';
  const estimatedCost = selectedSvc && weight ? (Number(selectedSvc.basePrice) * parseFloat(weight)).toFixed(0) : '0';

  const handleCreate = async () => {
    if (!selectedSvc) { Alert.alert('Error', 'Please select a service'); return; }
    if (isKiloan && !weight) { Alert.alert('Error', 'Please enter weight'); return; }
    setLoading(true);
    try {
      const order: any = await post('/orders', {
        serviceTypeId: selectedSvc.id,
        totalWeight: isKiloan ? parseFloat(weight) : undefined,
        notes: notes || undefined,
        promoCode: promo || undefined,
      });
      Alert.alert('Success!', `Order #${order.orderNumber} created!`, [
        { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { id: order.id }) },
        { text: 'OK', onPress: () => navigation.navigate('Orders') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.section}>
        <Text style={s.sectionTitle}>Select Service</Text>
        {services.map((svc) => (
          <TouchableOpacity
            key={svc.id}
            onPress={() => setSelectedSvc(svc)}
            style={[s.serviceCard, selectedSvc?.id === svc.id && s.serviceCardActive]}
          >
            <Text style={[s.serviceName, selectedSvc?.id === svc.id && { color: '#fff' }]}>{svc.name}</Text>
            <Text style={[s.servicePrice, selectedSvc?.id === svc.id && { color: 'rgba(255,255,255,0.8)' }]}>
              Rp {Number(svc.basePrice).toLocaleString('id-ID')}/{svc.unit} • {svc.slaHours}h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSvc && isKiloan && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Weight (kg)</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="e.g. 3.5"
          />
          {weight && (
            <Text style={s.estimate}>Estimated: Rp {Number(estimatedCost).toLocaleString('id-ID')}</Text>
          )}
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Promo Code (optional)</Text>
        <TextInput style={s.input} value={promo} onChangeText={setPromo} placeholder="e.g. WELCOME10" autoCapitalize="characters" />
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Notes (optional)</Text>
        <TextInput style={[s.input, { height: 80 }]} value={notes} onChangeText={setNotes} placeholder="Special instructions..." multiline />
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Order</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F9FAFB' },
  section:           { padding: 16, paddingBottom: 0 },
  sectionTitle:      { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  serviceCard:       { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: '#E5E7EB' },
  serviceCardActive: { backgroundColor: '#1E3A5F', borderColor: '#1E3A5F' },
  serviceName:       { fontWeight: '600', color: '#111827', fontSize: 14 },
  servicePrice:      { color: '#6B7280', fontSize: 12, marginTop: 3 },
  input:             { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15 },
  estimate:          { color: '#1E3A5F', fontWeight: '600', marginTop: 8, fontSize: 14 },
  submitBtn:         { backgroundColor: '#1E3A5F', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText:        { color: '#fff', fontWeight: '700', fontSize: 16 },
});
