import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockDeliveries = [
  { id: '1', from: 'Nashik', to: 'Pune', crop: 'Wheat (500kg)', status: 'Picked Up', pay: '\u20B92,500' },
  { id: '2', from: 'Satara', to: 'Mumbai', crop: 'Tomatoes (200kg)', status: 'In Transit', pay: '\u20B94,500' },
  { id: '3', from: 'Sangli', to: 'Kolhapur', crop: 'Turmeric (150kg)', status: 'Assigned', pay: '\u20B91,800' },
  { id: '4', from: 'Latur', to: 'Pune', crop: 'Soybean (600kg)', status: 'Delivered', pay: '\u20B95,200' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Assigned': return '#E65100';
    case 'Picked Up': return '#1565C0';
    case 'In Transit': return '#6A1B9A';
    case 'Delivered': return '#2E7D32';
    default: return Colors.textSecondary;
  }
};

const MyDeliveriesScreen = () => {
  const renderDelivery = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <MaterialIcons name="radio-button-checked" size={14} color="#2E7D32" />
        <Text style={styles.routeText}>{item.from}</Text>
        <MaterialIcons name="arrow-forward" size={14} color={Colors.textSecondary} />
        <MaterialIcons name="location-on" size={14} color="#D32F2F" />
        <Text style={styles.routeText}>{item.to}</Text>
      </View>
      <Text style={styles.crop}>{item.crop}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.pay}>{item.pay}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={mockDeliveries}
      renderItem={renderDelivery}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeText: { fontSize: 14, fontWeight: '500', color: Colors.text, marginHorizontal: 4 },
  crop: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  pay: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});

export default MyDeliveriesScreen;
