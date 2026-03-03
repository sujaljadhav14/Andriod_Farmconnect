import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const stats = [
  { label: 'Active Crops', value: '8', icon: 'grass', color: '#2E7D32' },
  { label: 'Pending Orders', value: '3', icon: 'hourglass-empty', color: '#E65100' },
  { label: 'Completed', value: '24', icon: 'check-circle', color: '#1565C0' },
  { label: 'Earnings', value: '\u20B91.2L', icon: 'account-balance-wallet', color: '#6A1B9A' },
];

const recentOrders = [
  { id: '1', crop: 'Wheat', buyer: 'Rajesh Traders', qty: '500 kg', status: 'Pending', statusColor: '#E65100' },
  { id: '2', crop: 'Rice (Basmati)', buyer: 'Anil & Sons', qty: '1000 kg', status: 'In Transit', statusColor: '#1565C0' },
  { id: '3', crop: 'Tomatoes', buyer: 'Fresh Foods Co.', qty: '200 kg', status: 'Delivered', statusColor: '#2E7D32' },
];

const FarmerDashboardScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.nameText}>Farmer Demo User</Text>
        </View>
        <MaterialIcons name="notifications-none" size={28} color={Colors.white} />
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <MaterialIcons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddCrop')}>
            <MaterialIcons name="add-circle" size={28} color={Colors.primary} />
            <Text style={styles.actionText}>Add Crop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="bar-chart" size={28} color="#E65100" />
            <Text style={styles.actionText}>Market Prices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="people" size={28} color="#1565C0" />
            <Text style={styles.actionText}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="calendar-today" size={28} color="#6A1B9A" />
            <Text style={styles.actionText}>Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderLeft}>
              <Text style={styles.orderCrop}>{order.crop}</Text>
              <Text style={styles.orderBuyer}>{order.buyer}</Text>
              <Text style={styles.orderQty}>{order.qty}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: order.statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: order.statusColor }]}>
                {order.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeCard: {
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: '2%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    width: '23%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 11,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderLeft: {
    flex: 1,
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
  orderQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FarmerDashboardScreen;
