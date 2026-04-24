import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import transportService from '../../services/transportService';
import vehicleService from '../../services/vehicleService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DASHBOARD_FEATURES = [
  { key: 'available', title: 'Available Orders', icon: 'local-shipping', color: '#1565C0', screen: 'AvailableOrders' },
  { key: 'deliveries', title: 'My Deliveries', icon: 'delivery-dining', color: '#2E7D32', screen: 'MyDeliveries' },
  { key: 'kyc', title: 'KYC Verification', icon: 'badge', color: '#3949AB', screen: 'KYC' },
  { key: 'history', title: 'Delivery History', icon: 'history', color: '#FB8C00', screen: 'DeliveryHistory' },
  { key: 'routes', title: 'Route Planning', icon: 'map', color: '#00838F', screen: 'RoutePlanning' },
  { key: 'earnings', title: 'Earnings', icon: 'account-balance-wallet', color: '#7B1FA2', screen: 'Earnings' },
  { key: 'schedule', title: 'Schedule', icon: 'event-available', color: '#455A64', screen: 'Schedule' },
  { key: 'vehicles', title: 'Vehicles', icon: 'directions-car', color: '#E65100', screen: 'Vehicles' },
  { key: 'support', title: 'Support', icon: 'support-agent', color: '#0288D1', screen: 'Support' },
];

const TransportDashboardScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };
  const [stats, setStats] = useState([
    { key: 'active', label: 'Active Deliveries', value: '0', icon: 'local-shipping', color: '#1565C0' },
    { key: 'completed', label: 'Completed', value: '0', icon: 'check-circle', color: '#2E7D32' },
    { key: 'vehicles', label: 'Vehicles', value: '0', icon: 'directions-car', color: '#E65100' },
    { key: 'earnings', label: 'Earnings', value: '0', icon: 'account-balance-wallet', color: '#6A1B9A' },
  ]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [activeResponse, historyResponse, vehiclesResponse] = await Promise.all([
        transportService.getMyDeliveries({ status: 'active' }),
        transportService.getMyDeliveries({ history: true }),
        vehicleService.getMyVehicles(),
      ]);

      const active = transportService.normalizeDeliveries(activeResponse.data || []);
      const history = transportService.normalizeDeliveries(historyResponse.data || []);
      const vehicles = vehicleService.normalizeVehicles(vehiclesResponse.data || []);

      const totalEarnings = history
        .filter((item) => ['delivered', 'completed'].includes((item.status || '').toLowerCase()))
        .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

      setActiveDeliveries(active.slice(0, 5));
      setStats([
        {
          key: 'active',
          label: 'Active Deliveries',
          value: String(active.length),
          icon: 'local-shipping',
          color: '#1565C0',
        },
        {
          key: 'completed',
          label: 'Completed',
          value: String(history.filter((item) => ['delivered', 'completed'].includes((item.status || '').toLowerCase())).length),
          icon: 'check-circle',
          color: '#2E7D32',
        },
        {
          key: 'vehicles',
          label: 'Vehicles',
          value: String(vehicles.length),
          icon: 'directions-car',
          color: '#E65100',
        },
        {
          key: 'earnings',
          label: 'Earnings',
          value: formatCurrency(totalEarnings),
          icon: 'account-balance-wallet',
          color: '#6A1B9A',
        },
      ]);
    } catch (err) {
      console.error('Failed to load transport dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
      setActiveDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadDashboard();
    }
  }, [isFocused, loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(false);
  };

  const openDeliveryDetail = (delivery) => {
    if (!delivery?.id) return;
    navigation.navigate('DeliveryDetail', { deliveryId: delivery.id });
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText}>{user?.name || 'Transporter'}</Text>
          <Text style={styles.roleText}>Transport</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="power-settings-new" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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

      {error ? (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadDashboard()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transport Features</Text>
        <View style={styles.featureGrid}>
          {DASHBOARD_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.key}
              style={styles.featureCard}
              onPress={() => navigation.navigate(feature.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: `${feature.color}1A` }]}>
                <MaterialIcons name={feature.icon} size={18} color={feature.color} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Deliveries</Text>
        {activeDeliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="inbox" size={28} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No active deliveries right now.</Text>
          </View>
        ) : null}

        {activeDeliveries.map((delivery) => (
          <TouchableOpacity
            key={delivery.id}
            style={styles.deliveryCard}
            activeOpacity={0.8}
            onPress={() => openDeliveryDetail(delivery)}
          >
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <MaterialIcons name="radio-button-checked" size={16} color="#2E7D32" />
                <Text style={styles.routeText}>{delivery.pickupCity || 'Pickup'}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={16} color={Colors.textSecondary} />
              <View style={styles.routePoint}>
                <MaterialIcons name="location-on" size={16} color="#D32F2F" />
                <Text style={styles.routeText}>{delivery.deliveryCity || 'Destination'}</Text>
              </View>
            </View>
            <Text style={styles.deliveryCrop}>{delivery.cropName}</Text>
            <View style={styles.deliveryBottom}>
              <View>
                <StatusBadge status={delivery.statusLabel} size="small" />
              </View>
              <Text style={styles.eta}>{formatDate(delivery.updatedAt || delivery.createdAt, 'datetime')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  welcomeCard: {
    backgroundColor: '#1565C0',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: { fontSize: 14, color: '#FFFFFF', opacity: 0.85 },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginTop: 2 },
  roleText: { fontSize: 12, color: '#FFFFFF', opacity: 0.8, marginTop: 2 },
  logoutBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
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
  errorCard: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { flex: 1, marginLeft: 8, color: Colors.error, fontSize: 13 },
  retryBtn: { backgroundColor: Colors.error, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  retryText: { color: Colors.white, fontWeight: '600', fontSize: 12 },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '31%',
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureTitle: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 14,
  },
  deliveryCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routePoint: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routeText: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4 },
  deliveryCrop: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  deliveryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  eta: { fontSize: 12, color: Colors.textSecondary },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  emptyText: { marginTop: 8, fontSize: 13, color: Colors.textSecondary },
});

export default TransportDashboardScreen;
