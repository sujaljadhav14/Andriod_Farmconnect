/**
 * My Orders Screen - Farmer
 * Shows all orders for the farmer with status tabs and actions
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import orderService from '../../services/orderService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Grains':
      return 'grass';
    case 'Vegetables':
      return 'eco';
    case 'Fruits':
      return 'local-florist';
    case 'Spices':
      return 'local-fire-department';
    case 'Pulses':
      return 'grain';
    default:
      return 'agriculture';
  }
};

const MyOrdersScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');

  const loadOrders = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await orderService.getFarmerOrders();
      const normalizedOrders = orderService.normalizeOrders(
        response.orders || response.data || []
      );
      setOrders(normalizedOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Failed to load orders');
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

  const handleMarkReady = (order) => {
    Alert.alert(
      'Mark as Ready',
      `Confirm that the crop is ready for pickup?\n\n${order.crop?.cropName}: ${order.quantity} ${order.unit}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Ready',
          onPress: async () => {
            try {
              await orderService.markReady(order.id);
              setOrders(orders.map(o =>
                o.id === order.id ? { ...o, status: 'Ready for Pickup' } : o
              ));
              Alert.alert('Success', 'Order marked as ready for pickup.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = (order) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.cancelOrder(order.id, 'Cancelled by farmer');
              setOrders(orders.map(o =>
                o.id === order.id ? { ...o, status: 'Cancelled' } : o
              ));
              Alert.alert('Order Cancelled', 'The order has been cancelled.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const filterOrders = (ordersToFilter) => {
    switch (selectedTab) {
      case 'active':
        return ordersToFilter.filter(o =>
          !['Completed', 'Cancelled', 'Delivered', 'Rejected'].includes(o.status)
        );
      case 'completed':
        return ordersToFilter.filter(o =>
          ['Completed', 'Delivered'].includes(o.status)
        );
      case 'cancelled':
        return ordersToFilter.filter(o =>
          ['Cancelled', 'Rejected'].includes(o.status)
        );
      default:
        return ordersToFilter;
    }
  };

  const filteredOrders = filterOrders(orders);

  const renderOrder = ({ item }) => {
    const canMarkReady = item.status === 'Accepted' || item.status === 'Both Agreed';
    const canCancel = ['Pending', 'Farmer Agreed', 'Both Agreed'].includes(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, order: item })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.cropImageContainer}>
            {item.crop?.cropImage ? (
              <Image source={{ uri: item.crop.cropImage }} style={styles.cropImage} />
            ) : (
              <View style={styles.cropImagePlaceholder}>
                <MaterialIcons
                  name={getCategoryIcon(item.crop?.category)}
                  size={24}
                  color={Colors.textSecondary}
                />
              </View>
            )}
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.cropName} numberOfLines={1}>
              {item.crop?.cropName || 'Unknown Crop'}
            </Text>
            <Text style={styles.buyerName} numberOfLines={1}>
              Buyer: {item.trader?.name || 'Trader'}
            </Text>
          </View>

          <StatusBadge status={item.status} size="small" />
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="inventory" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.quantity} {item.unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="payments" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatCurrency(item.pricePerUnit)}/{item.unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="account-balance-wallet" size={16} color={Colors.primary} />
            <Text style={[styles.detailText, styles.totalText]}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.dateInfo}>
            <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {item.paymentStatus && (
            <View style={styles.paymentBadge}>
              <MaterialIcons
                name={item.paymentStatus === 'Full Paid' || item.paymentStatus === 'Completed' ? 'check-circle' : 'pending'}
                size={14}
                color={item.paymentStatus === 'Full Paid' || item.paymentStatus === 'Completed' ? '#2E7D32' : '#E65100'}
              />
              <Text style={[styles.paymentText, {
                color: item.paymentStatus === 'Full Paid' || item.paymentStatus === 'Completed' ? '#2E7D32' : '#E65100'
              }]}>
                {item.paymentStatus}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {(canMarkReady || canCancel) && (
          <View style={styles.actionButtons}>
            {canMarkReady && (
              <TouchableOpacity
                style={styles.readyButton}
                onPress={() => handleMarkReady(item)}
              >
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.readyButtonText}>Mark Ready</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item)}
              >
                <MaterialIcons name="close" size={16} color={Colors.error} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      {/* Status Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const count = item.key === 'all'
              ? orders.length
              : filterOrders(orders).length;
            return (
              <TouchableOpacity
                style={[styles.tab, selectedTab === item.key && styles.tabActive]}
                onPress={() => setSelectedTab(item.key)}
              >
                <Text style={[styles.tabText, selectedTab === item.key && styles.tabTextActive]}>
                  {item.label}
                </Text>
                {selectedTab === item.key && (
                  <Text style={styles.tabCount}>({filterOrders(orders).length})</Text>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.tabList}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          filteredOrders.length > 0 ? (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {error ? 'Failed to load orders' : 'No orders found'}
            </Text>
            <Text style={styles.emptyText}>
              {error ||
                (selectedTab === 'all'
                  ? "When traders place orders for your crops, they'll appear here"
                  : `No ${selectedTab} orders`)}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders()}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  summary: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  buyerName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  totalText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
  },
  readyButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  cancelButtonText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MyOrdersScreen;
