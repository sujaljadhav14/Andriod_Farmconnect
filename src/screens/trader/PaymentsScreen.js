import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import orderService from '../../services/orderService';
import transactionService from '../../services/transactionService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/common';

const PaymentsScreen = ({ route, navigation }) => {
  const isFocused = useIsFocused();
  const focusedOrderId = route?.params?.focusOrderId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState('');

  const [pendingOrders, setPendingOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [ordersResponse, transactionsResponse, statsResponse] = await Promise.all([
        orderService.getTraderOrders(),
        transactionService.getMyTransactions({ limit: 20 }),
        transactionService.getTransactionStats(),
      ]);

      const allOrders = orderService.normalizeOrders(ordersResponse?.orders || ordersResponse?.data || []);

      const unpaidOrders = allOrders
        .map((order) => ({
          ...order,
          dueAmount: Math.max(Number(order.totalAmount || 0) - Number(order.paidAmount || 0), 0),
        }))
        .filter((order) => !['Cancelled', 'Completed'].includes(order.status))
        .filter((order) => !['paid', 'completed'].includes((order.paymentStatusRaw || '').toLowerCase()))
        .sort((a, b) => {
          if (focusedOrderId && a.id === focusedOrderId) return -1;
          if (focusedOrderId && b.id === focusedOrderId) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      setPendingOrders(unpaidOrders);
      setTransactions(transactionsResponse?.transactions || []);
      setStats(statsResponse?.overall || statsResponse?.data?.overall || statsResponse?.overall || null);
    } catch (err) {
      console.error('Failed to load payments data:', err);
      setError(err.message || 'Failed to load payment details');
      setPendingOrders([]);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [focusedOrderId]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const performDummyPayment = async (order, paymentMethod) => {
    const dueAmount = Number(order?.dueAmount || 0);

    if (!dueAmount || dueAmount <= 0) {
      Alert.alert('No Payment Due', 'This order does not have any pending amount.');
      return;
    }

    setProcessingOrderId(order.id);
    try {
      const result = await transactionService.createDummyPayment(order.id, dueAmount, paymentMethod, {
        type: 'full_payment',
        notes: `Dummy payment via ${paymentMethod}`,
      });

      await loadData(false);

      const reference = result?.transaction?.referenceNumber || 'N/A';
      const agreementNumber = result?.agreement?.documentNumber;
      const agreementLine = agreementNumber
        ? `\nLegal agreement generated: ${agreementNumber}`
        : '\nLegal agreement is generated automatically after successful payment.';

      Alert.alert(
        'Dummy Payment Successful',
        `Reference: ${reference}${agreementLine}`,
        [
          {
            text: 'View Order',
            onPress: () => navigation.navigate('OrderDetail', { orderId: order.id }),
          },
          { text: 'OK' },
        ]
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.message || 'Failed to create dummy payment transaction');
    } finally {
      setProcessingOrderId('');
    }
  };

  const handlePayNow = (order) => {
    Alert.alert(
      'Select Dummy Payment Method',
      `Pay ${formatCurrency(order.dueAmount)} for order #${order.orderNumber}`,
      [
        { text: 'UPI', onPress: () => performDummyPayment(order, 'upi') },
        { text: 'Bank Transfer', onPress: () => performDummyPayment(order, 'bank_transfer') },
        { text: 'Cash', onPress: () => performDummyPayment(order, 'cash') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading payments..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E65100']} />
      }
    >
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Dummy Payment Console</Text>
        <Text style={styles.description}>
          Use this screen to settle trader payments in simulation mode only. No real payment gateway is used.
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{stats?.totalTransactions || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.totalAmount || 0)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Completed Amount</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats?.completedAmount || 0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pending Payments</Text>

        {pendingOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={22} color={Colors.success} />
            <Text style={styles.emptyText}>No pending trader payments right now.</Text>
          </View>
        ) : (
          pendingOrders.map((order) => {
            const isProcessing = processingOrderId === order.id;

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                  <Text style={styles.orderStatus}>{order.paymentStatus}</Text>
                </View>

                <Text style={styles.orderCrop}>{order.crop?.cropName || 'Crop Order'}</Text>
                <Text style={styles.orderMeta}>Farmer: {order.farmer?.name || 'Farmer'}</Text>

                <View style={styles.orderAmounts}>
                  <View>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.amountValue}>{formatCurrency(order.totalAmount || 0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>Paid</Text>
                    <Text style={styles.amountValue}>{formatCurrency(order.paidAmount || 0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>Due</Text>
                    <Text style={[styles.amountValue, { color: '#E65100' }]}>{formatCurrency(order.dueAmount)}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  >
                    <Text style={styles.secondaryButtonText}>View Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payButton, isProcessing && styles.disabledButton]}
                    onPress={() => handlePayNow(order)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="payment" size={16} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Pay Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={22} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          transactions.slice(0, 10).map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionRef}>{transaction.referenceNumber || 'N/A'}</Text>
                <Text style={styles.transactionMeta}>Order #{transaction.orderNumber || '-'}</Text>
                <Text style={styles.transactionMeta}>{formatDate(transaction.createdAt)}</Text>
              </View>

              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{formatCurrency(transaction.amount)}</Text>
                <Text
                  style={[
                    styles.transactionStatus,
                    {
                      color:
                        transaction.status === 'Completed'
                          ? Colors.success
                          : transaction.status === 'Failed'
                            ? Colors.error
                            : Colors.warning,
                    },
                  ]}
                >
                  {transaction.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
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
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },
  orderCrop: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  orderAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E65100',
    borderRadius: 8,
    paddingVertical: 10,
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.75,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  transactionRef: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  transactionMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    marginLeft: 8,
  },
});

export default PaymentsScreen;