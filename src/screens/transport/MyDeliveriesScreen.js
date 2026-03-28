import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
];

const MyDeliveriesScreen = () => {
  const isFocused = useIsFocused();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);

  const loadDeliveries = useCallback(async (tab = selectedTab, showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await transportService.getMyDeliveries({
        history: tab === 'history',
        status: tab,
      });
      const normalized = transportService.normalizeDeliveries(response.data || response.orders || []);
      setDeliveries(normalized);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
      setError(err.message || 'Failed to load deliveries');
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (isFocused) {
      loadDeliveries(selectedTab);
    }
  }, [isFocused, selectedTab, loadDeliveries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDeliveries(selectedTab, false);
  }, [selectedTab, loadDeliveries]);

  const handleUpdateStatus = (delivery, status) => {
    const actionLabel = status === 'delivered' ? 'mark as delivered' : 'mark as completed';

    Alert.alert(
      'Update Delivery',
      `Do you want to ${actionLabel}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setUpdatingId(delivery.id);
              await transportService.updateDeliveryStatus(delivery.id, status);
              Alert.alert('Success', 'Delivery status updated');
              loadDeliveries(selectedTab, false);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update status');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const renderDelivery = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <MaterialIcons name="radio-button-checked" size={14} color="#2E7D32" />
        <Text style={styles.routeText}>{item.pickupCity || 'Pickup'}</Text>
        <MaterialIcons name="arrow-forward" size={14} color={Colors.textSecondary} />
        <MaterialIcons name="location-on" size={14} color="#D32F2F" />
        <Text style={styles.routeText}>{item.deliveryCity || 'Destination'}</Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <StatusBadge status={item.statusLabel} size="small" />
      </View>

      <Text style={styles.crop}>{item.cropName}</Text>
      <Text style={styles.metaText}>Qty: {item.quantity} {item.unit}</Text>
      <Text style={styles.metaText}>Scheduled: {formatDate(item.scheduledDate || item.createdAt)}</Text>

      <View style={styles.cardBottom}>
        <Text style={styles.pay}>{formatCurrency(item.totalAmount)}</Text>
        <Text style={styles.dateText}>{formatDate(item.updatedAt || item.createdAt)}</Text>
      </View>

      {item.transport?.vehicleNumber ? (
        <View style={styles.vehicleRow}>
          <MaterialIcons name="directions-car" size={14} color={Colors.textSecondary} />
          <Text style={styles.vehicleText}>{item.transport.vehicleNumber}</Text>
        </View>
      ) : null}

      {item.status === 'in_transit' ? (
        <TouchableOpacity
          style={[styles.actionButton, updatingId === item.id && styles.actionButtonDisabled]}
          onPress={() => handleUpdateStatus(item, 'delivered')}
          disabled={updatingId === item.id}
        >
          <Text style={styles.actionButtonText}>
            {updatingId === item.id ? 'Updating...' : 'Mark Delivered'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {item.status === 'delivered' ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton, updatingId === item.id && styles.actionButtonDisabled]}
          onPress={() => handleUpdateStatus(item, 'completed')}
          disabled={updatingId === item.id}
        >
          <Text style={styles.actionButtonText}>
            {updatingId === item.id ? 'Updating...' : 'Mark Completed'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading deliveries..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="local-shipping" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>{error ? 'Failed to load deliveries' : 'No deliveries found'}</Text>
            <Text style={styles.emptyText}>
              {error || (selectedTab === 'active'
                ? 'Accept an available order to start your first delivery.'
                : 'Completed or cancelled deliveries will appear here.')}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadDeliveries(selectedTab)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#1565C015' },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#1565C0' },
  list: { padding: 16, paddingTop: 10 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeText: { fontSize: 14, fontWeight: '500', color: Colors.text, marginHorizontal: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderNumber: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  crop: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  metaText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  pay: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  dateText: { fontSize: 12, color: Colors.textSecondary },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  vehicleText: { marginLeft: 6, fontSize: 12, color: Colors.textSecondary },
  actionButton: {
    marginTop: 12,
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: { backgroundColor: '#2E7D32' },
  actionButtonDisabled: { opacity: 0.7 },
  actionButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptyText: { marginTop: 8, color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
  retryBtn: { marginTop: 16, backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});

export default MyDeliveriesScreen;
