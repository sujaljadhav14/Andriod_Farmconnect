import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockOrders = [
  { id: '1', crop: 'Wheat', farmer: 'Ramesh Patil', qty: '500 kg', total: '\u20B914,000', status: 'Accepted', date: '25 Jan 2025' },
  { id: '2', crop: 'Rice', farmer: 'Sunil Jadhav', qty: '1000 kg', total: '\u20B965,000', status: 'Pending', date: '22 Jan 2025' },
  { id: '3', crop: 'Tomatoes', farmer: 'Priya Deshmukh', qty: '200 kg', total: '\u20B98,000', status: 'Delivered', date: '18 Jan 2025' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#E65100';
    case 'Accepted': return '#1565C0';
    case 'Delivered': return '#2E7D32';
    default: return Colors.textSecondary;
  }
};

const TraderMyOrdersScreen = () => {
  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.cropName}>{item.crop}</Text>
          <Text style={styles.farmerName}>From: {item.farmer}</Text>
        </View>
        <Text style={styles.total}>{item.total}</Text>
      </View>
      <View style={styles.orderBottom}>
        <Text style={styles.meta}>{item.qty} | {item.date}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={mockOrders}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cropName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  farmerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  total: { fontSize: 16, fontWeight: 'bold', color: '#E65100' },
  orderBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12,
  },
  meta: { fontSize: 12, color: Colors.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});

export default TraderMyOrdersScreen;
