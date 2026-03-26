/**
 * Order Detail Screen - For Both Farmer and Trader
 * Shows comprehensive order information with role-specific actions
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

const OrderDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { orderId, order: initialOrder } = route.params || {};

  const [order, setOrder] = useState(initialOrder ? orderService.normalizeOrder(initialOrder) : null);
  const [loading, setLoading] = useState(!initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const isFarmer = user?.role === 'farmer';
  const isTrader = user?.role === 'trader';

  const loadOrderDetails = useCallback(async (showLoader = true) => {
    if (!orderId && !initialOrder?.id) return;

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await orderService.getOrderDetails(orderId || initialOrder?.id);
      const normalizedOrder = orderService.normalizeOrder(response.order || response.data || response);
      setOrder(normalizedOrder);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError(err.message || 'Failed to load order details');
      if (!order && initialOrder) {
        setOrder(orderService.normalizeOrder(initialOrder));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, initialOrder?.id]);

  useEffect(() => {
    if (isFocused && (orderId || initialOrder?.id)) {
      loadOrderDetails();
    }
  }, [isFocused, loadOrderDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrderDetails(false);
  }, [loadOrderDetails]);

  // Farmer Actions
  const handleMarkReady = () => {
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
              setOrder({ ...order, status: 'Ready for Pickup' });
              Alert.alert('Success', 'Order marked as ready for pickup.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  // Both Roles
  const handleCancelOrder = () => {
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
              const reason = `Cancelled by ${isFarmer ? 'farmer' : 'trader'}`;
              await orderService.cancelOrder(order.id, reason);
              setOrder({ ...order, status: 'Cancelled' });
              Alert.alert('Order Cancelled', 'The order has been cancelled.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const handleContactPhone = (phone, personType) => {
    if (phone) {
      Alert.alert(
        `Contact ${personType}`,
        `Call +91 ${phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:+91${phone}`) },
        ]
      );
    }
  };

  const handleWhatsApp = (phone, personType) => {
    if (phone) {
      const message = `Hello, I'm contacting you regarding order #${order.orderNumber} on FarmConnect.`;
      const whatsappUrl = `whatsapp://send?phone=+91${phone}&text=${encodeURIComponent(message)}`;
      Linking.canOpenURL(whatsappUrl).then(supported => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on this device.');
        }
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading order details..." />;
  }

  if (error && !order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Failed to load order</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadOrderDetails()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="receipt-long" size={48} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>Order not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canMarkReady = isFarmer && (order.status === 'Accepted' || order.status === 'Both Agreed');
  const canCancel = ['Pending', 'Farmer Agreed', 'Both Agreed'].includes(order.status);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.orderNumberSection}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Crop Information */}
        <View style={styles.cropSection}>
          <View style={styles.cropImageContainer}>
            {order.crop?.cropImage ? (
              <Image source={{ uri: order.crop.cropImage }} style={styles.cropImage} />
            ) : (
              <View style={styles.cropImagePlaceholder}>
                <MaterialIcons
                  name={getCategoryIcon(order.crop?.category)}
                  size={32}
                  color={Colors.textSecondary}
                />
              </View>
            )}
          </View>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{order.crop?.cropName || 'Unknown Crop'}</Text>
            <View style={styles.cropDetails}>
              <Text style={styles.cropCategory}>{order.crop?.category}</Text>
              <View style={styles.separator} />
              <Text style={styles.cropQuantity}>
                {order.quantity} {order.unit}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Price Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Price Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price per {order.unit}</Text>
          <Text style={styles.summaryValue}>{formatCurrency(order.pricePerUnit)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quantity</Text>
          <Text style={styles.summaryValue}>{order.quantity} {order.unit}</Text>
        </View>
        {order.platformFee > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.platformFee)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </View>

      {/* People Information */}
      <View style={styles.peopleCard}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        {/* Farmer Info */}
        {order.farmer && (
          <View style={styles.personSection}>
            <View style={styles.personHeader}>
              <MaterialIcons name="agriculture" size={20} color="#2E7D32" />
              <Text style={styles.personLabel}>Farmer</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{order.farmer.name}</Text>
              {order.farmer.phone && (
                <View style={styles.contactButtons}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactPhone(order.farmer.phone, 'Farmer')}
                  >
                    <MaterialIcons name="call" size={16} color={Colors.primary} />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contactButton, styles.whatsappButton]}
                    onPress={() => handleWhatsApp(order.farmer.phone, 'Farmer')}
                  >
                    <MaterialIcons name="chat" size={16} color="#25D366" />
                    <Text style={[styles.contactButtonText, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Trader Info */}
        {order.trader && (
          <View style={[styles.personSection, order.farmer && styles.borderTop]}>
            <View style={styles.personHeader}>
              <MaterialIcons name="store" size={20} color="#E65100" />
              <Text style={styles.personLabel}>Trader</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{order.trader.name}</Text>
              {order.trader.phone && (
                <View style={styles.contactButtons}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactPhone(order.trader.phone, 'Trader')}
                  >
                    <MaterialIcons name="call" size={16} color={Colors.primary} />
                    <Text style={styles.contactButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contactButton, styles.whatsappButton]}
                    onPress={() => handleWhatsApp(order.trader.phone, 'Trader')}
                  >
                    <MaterialIcons name="chat" size={16} color="#25D366" />
                    <Text style={[styles.contactButtonText, { color: '#25D366' }]}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Transport Info */}
        {order.transport && (
          <View style={[styles.personSection, styles.borderTop]}>
            <View style={styles.personHeader}>
              <MaterialIcons name="local-shipping" size={20} color="#1565C0" />
              <Text style={styles.personLabel}>Transport</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{order.transport.name}</Text>
              {order.transport.phone && (
                <Text style={styles.personPhone}>+91 {order.transport.phone}</Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Delivery Information */}
      {order.deliveryAddress && (
        <View style={styles.deliveryCard}>
          <Text style={styles.cardTitle}>Delivery Information</Text>
          <View style={styles.addressSection}>
            <MaterialIcons name="location-on" size={20} color={Colors.textSecondary} />
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
          {order.deliveryDate && (
            <View style={styles.dateSection}>
              <MaterialIcons name="event" size={20} color={Colors.textSecondary} />
              <Text style={styles.dateText}>
                Expected: {formatDate(order.deliveryDate)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Payment Information */}
      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>Payment Information</Text>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment Method</Text>
          <Text style={styles.paymentValue}>{order.paymentMethod || 'On Delivery'}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment Status</Text>
          <View style={styles.paymentStatusBadge}>
            <MaterialIcons
              name={order.paymentStatus === 'Full Paid' || order.paymentStatus === 'Completed' ? 'check-circle' : 'pending'}
              size={16}
              color={order.paymentStatus === 'Full Paid' || order.paymentStatus === 'Completed' ? '#2E7D32' : '#E65100'}
            />
            <Text
              style={[
                styles.paymentStatusText,
                {
                  color: order.paymentStatus === 'Full Paid' || order.paymentStatus === 'Completed' ? '#2E7D32' : '#E65100'
                }
              ]}
            >
              {order.paymentStatus || 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Status Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.cardTitle}>Order Status</Text>
        <View style={styles.currentStatus}>
          <StatusBadge status={order.status} size="large" />
          <Text style={styles.currentStatusText}>{order.status}</Text>
        </View>

        {/* Status Description */}
        <Text style={styles.statusDescription}>
          {order.status === 'Pending' && 'Order is waiting for farmer confirmation.'}
          {order.status === 'Farmer Agreed' && 'Farmer has agreed. Waiting for trader confirmation.'}
          {order.status === 'Both Agreed' && 'Both parties have agreed to the order.'}
          {order.status === 'Accepted' && 'Order has been accepted and is being prepared.'}
          {order.status === 'Ready for Pickup' && 'Crop is ready for pickup or transport.'}
          {order.status === 'Transport Assigned' && 'Transport has been assigned for delivery.'}
          {order.status === 'In Transit' && 'Order is being transported to destination.'}
          {order.status === 'Delivered' && 'Order has been successfully delivered.'}
          {order.status === 'Completed' && 'Order has been completed successfully.'}
          {order.status === 'Cancelled' && 'Order has been cancelled.'}
          {order.status === 'Rejected' && 'Order has been rejected.'}
        </Text>
      </View>

      {/* Action Buttons */}
      {(canMarkReady || canCancel) && (
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            {canMarkReady && (
              <TouchableOpacity style={styles.readyButton} onPress={handleMarkReady}>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.readyButtonText}>Mark Ready for Pickup</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                <MaterialIcons name="close" size={20} color={Colors.error} />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumberSection: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cropSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 14,
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
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  cropDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 8,
  },
  cropQuantity: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  peopleCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  personSection: {
    marginBottom: 16,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  personInfo: {
    marginLeft: 28,
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  personPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  whatsappButton: {
    borderColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 4,
  },
  deliveryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
    lineHeight: 20,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  paymentCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  actionButtons: {
    gap: 12,
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 10,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
    paddingVertical: 14,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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

export default OrderDetailScreen;