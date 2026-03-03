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
  { id: '1', crop: 'Wheat', buyer: 'Rajesh Traders', qty: '500 kg', total: '\u20B914,000', status: 'Pending', date: '25 Jan 2025' },
  { id: '2', crop: 'Rice (Basmati)', buyer: 'Anil & Sons', qty: '1000 kg', total: '\u20B965,000', status: 'In Transit', date: '22 Jan 2025' },
  { id: '3', crop: 'Tomatoes', buyer: 'Fresh Foods Co.', qty: '200 kg', total: '\u20B98,000', status: 'Delivered', date: '18 Jan 2025' },
  { id: '4', crop: 'Onions', buyer: 'Metro Mart', qty: '300 kg', total: '\u20B96,600', status: 'Completed', date: '10 Jan 2025' },
  { id: '5', crop: 'Soybean', buyer: 'Agro Exports', qty: '600 kg', total: '\u20B933,000', status: 'Pending', date: '28 Jan 2025' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#E65100';
    case 'In Transit': return '#1565C0';
    case 'Delivered': return '#2E7D32';
    case 'Completed': return '#6A1B9A';
    default: return Colors.textSecondary;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return 'hourglass-empty';
    case 'In Transit': return 'local-shipping';
    case 'Delivered': return 'check-circle';
    case 'Completed': return 'done-all';
    default: return 'help-outline';
  }
};

const MyOrdersScreen = () => {
  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.orderCrop}>{item.crop}</Text>
          <Text style={styles.orderBuyer}>{item.buyer}</Text>
        </View>
        <Text style={styles.orderTotal}>{item.total}</Text>
      </View>
      <View style={styles.orderBottom}>
        <View style={styles.orderMeta}>
          <MaterialIcons name="inventory" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.qty}</Text>
          <MaterialIcons name="calendar-today" size={14} color={Colors.textSecondary} style={{ marginLeft: 12 }} />
          <Text style={styles.metaText}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <MaterialIcons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderCrop: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  orderBuyer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default MyOrdersScreen;
