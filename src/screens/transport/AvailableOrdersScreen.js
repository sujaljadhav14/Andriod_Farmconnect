import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AvailableOrdersScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadOrders = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await transportService.getAvailableOrders();
      const normalized = transportService.normalizeDeliveries(response.data || response.orders || []);
      setOrders(normalized);
    } catch (err) {
      console.error('Failed to load available transport orders:', err);
      setError(err.message || 'Failed to load available orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadOrders();
    }
  }, [isFocused, loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(false);
  }, [loadOrders]);

  const handleAccept = (order) => {
    Alert.alert(
      'Accept Delivery',
      `Do you want to accept delivery for ${order.cropName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setAcceptingId(order.id);
              await transportService.acceptDelivery(order.id);
              Alert.alert('Success', 'Delivery accepted successfully');
              openDeliveryDetail(order);
              loadOrders(false);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to accept delivery');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const openDeliveryDetail = (order) => {
    if (!order?.id) return;

    const routeNames = navigation?.getState?.()?.routeNames || [];
    if (routeNames.includes('DeliveryDetail')) {
      navigation.navigate('DeliveryDetail', { deliveryId: order.id });
      return;
    }

    navigation.navigate('Dashboard', {
      screen: 'DeliveryDetail',
      params: { deliveryId: order.id },
    });
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <MaterialIcons name="radio-button-checked" size={16} color="#2E7D32" />
        <Text style={styles.routeFrom}>{item.pickupCity || 'Pickup'}</Text>
        <MaterialIcons name="more-horiz" size={16} color={Colors.textSecondary} />
        <MaterialIcons name="location-on" size={16} color="#D32F2F" />
        <Text style={styles.routeTo}>{item.deliveryCity || 'Destination'}</Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={styles.headerActions}>
          <StatusBadge status={item.statusLabel} size="small" />
          <TouchableOpacity style={styles.detailLink} onPress={() => openDeliveryDetail(item)}>
            <MaterialIcons name="open-in-new" size={14} color="#1565C0" />
            <Text style={styles.detailLinkText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.crop}>{item.cropName}</Text>
      <Text style={styles.metaText}>
        Qty: {item.quantity} {item.unit}
      </Text>
      <Text style={styles.pickup}>Pickup: {formatDate(item.scheduledDate || item.createdAt)}</Text>

      <View style={styles.cardBottom}>
        <Text style={styles.pay}>{formatCurrency(item.totalAmount)}</Text>
        <TouchableOpacity
          style={[styles.acceptBtn, acceptingId === item.id && styles.acceptBtnDisabled]}
          onPress={() => handleAccept(item)}
          disabled={acceptingId === item.id}
        >
          <Text style={styles.acceptBtnText}>
            {acceptingId === item.id ? 'Accepting...' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading available orders..." />;
  }

  return (
    <FlatList
      data={orders}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />
      }
      ListHeaderComponent={
        orders.length > 0 ? (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>{orders.length} available order(s)</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>{error ? 'Unable to load orders' : 'No available orders'}</Text>
          <Text style={styles.emptyText}>
            {error || 'No ready-for-pickup orders are available at the moment.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      }
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
  routeFrom: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4, marginRight: 4 },
  routeTo: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  detailLink: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#1565C015', borderRadius: 12 },
  detailLinkText: { marginLeft: 3, color: '#1565C0', fontSize: 11, fontWeight: '700' },
  crop: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  pickup: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  pay: { fontSize: 18, fontWeight: 'bold', color: '#1565C0' },
  acceptBtn: { backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  acceptBtnDisabled: { opacity: 0.7 },
  acceptBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  summary: { marginBottom: 12 },
  summaryText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});

export default AvailableOrdersScreen;
