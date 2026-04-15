import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { post } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) {
      Alert.alert('Error', 'Name, phone and password are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      // Register
      await post('/customers', {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
      });

      // Auto-login
      const result = await post<{ accessToken: string; refreshToken: string }>('/auth/customer/login', {
        phone: form.phone,
        password: form.password,
      });

      const { mobileApi } = await import('../../services/api');
      const meRes = await mobileApi.get('/customers/me', {
        headers: { Authorization: `Bearer ${result.accessToken}` },
      });

      await login(meRes.data.data, result.accessToken, result.refreshToken);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 24 }}>
        {['name', 'phone', 'email', 'password', 'confirmPassword'].map((field) => (
          <View key={field} style={{ marginBottom: 14 }}>
            <Text style={s.label}>{field.charAt(0).toUpperCase() + field.slice(1).replace('P', ' P')}</Text>
            <TextInput
              style={s.input}
              value={(form as any)[field]}
              onChangeText={(v) => setForm({ ...form, [field]: v })}
              secureTextEntry={field.toLowerCase().includes('password')}
              keyboardType={field === 'phone' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'}
              autoCapitalize="none"
              placeholder={field === 'phone' ? '08123456789' : ''}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F9FAFB' },
  label:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:      { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', fontSize: 15 },
  button:     { backgroundColor: '#1E3A5F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
