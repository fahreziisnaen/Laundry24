import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { post } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await post<{ accessToken: string; refreshToken: string }>('/auth/customer/login', {
        phone, password,
      });

      // Fetch customer profile
      const { mobileApi } = await import('../../services/api');
      const meRes = await mobileApi.get('/customers/me', {
        headers: { Authorization: `Bearer ${result.accessToken}` },
      });

      await login(meRes.data.data, result.accessToken, result.refreshToken);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logo}>
          <Text style={s.logoText}>L</Text>
        </View>
        <Text style={s.title}>Laundry24</Text>
        <Text style={s.subtitle}>Customer App</Text>
      </View>

      {/* Form */}
      <View style={s.card}>
        <Text style={s.label}>Phone Number</Text>
        <TextInput
          style={s.input}
          placeholder="08123456789"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E3A5F', justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 32 },
  logo:      { width: 56, height: 56, borderRadius: 16, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:  { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F' },
  title:     { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle:  { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:     { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button:    { backgroundColor: '#1E3A5F', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link:      { textAlign: 'center', marginTop: 16, color: '#6B7280', fontSize: 13 },
});
