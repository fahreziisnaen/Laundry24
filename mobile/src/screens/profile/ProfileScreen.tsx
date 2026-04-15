import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { customer, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    { icon: '📦', label: 'My Orders', onPress: () => navigation.navigate('Orders') },
    { icon: '💳', label: 'Wallet & Transactions', onPress: () => {} },
    { icon: '🔔', label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: '📍', label: 'Addresses', onPress: () => {} },
    { icon: '🔒', label: 'Change Password', onPress: () => {} },
    { icon: '❓', label: 'Help & Support', onPress: () => {} },
  ];

  return (
    <ScrollView style={s.container}>
      {/* Profile card */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{customer?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{customer?.name}</Text>
        <Text style={s.phone}>{customer?.phone}</Text>

        <View style={s.stats}>
          <View style={s.statItem}>
            <Text style={s.statValue}>Rp {Number(customer?.walletBalance ?? 0).toLocaleString('id-ID')}</Text>
            <Text style={s.statLabel}>Wallet</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{customer?.loyaltyPoints ?? 0}</Text>
            <Text style={s.statLabel}>Points</Text>
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={s.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={s.menuItem} onPress={item.onPress}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  header:      { backgroundColor: '#1E3A5F', padding: 24, paddingTop: 60, alignItems: 'center' },
  avatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 28, fontWeight: 'bold', color: '#1E3A5F' },
  name:        { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  phone:       { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  stats:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, marginTop: 16, gap: 20, alignSelf: 'stretch', justifyContent: 'center' },
  statItem:    { alignItems: 'center', flex: 1 },
  statValue:   { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  statLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  menu:        { backgroundColor: '#fff', margin: 12, borderRadius: 12, overflow: 'hidden' },
  menuItem:    { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  menuIcon:    { fontSize: 18, width: 30 },
  menuLabel:   { flex: 1, fontSize: 14, color: '#111827' },
  menuChevron: { color: '#9CA3AF', fontSize: 20 },
  logoutBtn:   { backgroundColor: '#FEE2E2', margin: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText:  { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
