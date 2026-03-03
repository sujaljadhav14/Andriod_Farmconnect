import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const stats = [
  { label: 'Active Deliveries', value: '3', icon: 'local-shipping', color: '#1565C0' },
  { label: 'Completed', value: '47', icon: 'check-circle', color: '#2E7D32' },
  { label: 'Vehicles', value: '2', icon: 'directions-car', color: '#E65100' },
  { label: 'Earnings', value: '\u20B985K', icon: 'account-balance-wallet', color: '#6A1B9A' },
];

const activeDeliveries = [
  { id: '1', from: 'Nashik', to: 'Pune', crop: 'Wheat (500kg)', status: 'Picked Up', eta: '3 hours' },
  { id: '2', from: 'Satara', to: 'Mumbai', crop: 'Tomatoes (200kg)', status: 'In Transit', eta: '5 hours' },
  { id: '3', from: 'Sangli', to: 'Kolhapur', crop: 'Turmeric (150kg)', status: 'Assigned', eta: 'Tomorrow' },
];

const TransportDashboardScreen = () => {
  return (
    <ScrollView style={styles.container}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Deliveries</Text>
        {activeDeliveries.map((delivery) => (
          <View key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <MaterialIcons name="radio-button-checked" size={16} color="#2E7D32" />
                <Text style={styles.routeText}>{delivery.from}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.textSecondary} />
              <View style={styles.routePoint}>
                <MaterialIcons name="location-on" size={16} color="#D32F2F" />
                <Text style={styles.routeText}>{delivery.to}</Text>
              </View>
            </View>
            <Text style={styles.deliveryCrop}>{delivery.crop}</Text>
            <View style={styles.deliveryBottom}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{delivery.status}</Text>
              </View>
              <Text style={styles.eta}>ETA: {delivery.eta}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
  statCard: {
    width: '46%', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, margin: '2%', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  deliveryCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routeText: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4 },
  deliveryCrop: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  deliveryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  statusBadge: { backgroundColor: '#1565C0' + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#1565C0' },
  eta: { fontSize: 12, color: Colors.textSecondary },
});

export default TransportDashboardScreen;
