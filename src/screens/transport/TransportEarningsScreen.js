import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const monthKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const TransportEarningsScreen = () => {
  const isFocused = useIsFocused();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await transportService.getMyDeliveries({ history: true });
      const normalized = transportService.normalizeDeliveries(response.data || response.orders || []);
      setHistory(normalized);
    } catch (err) {
      console.error('Failed to load earnings history:', err);
      setError(err.message || 'Failed to load earnings data');
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused, loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory(false);
  }, [loadHistory]);

  const delivered = useMemo(
    () => history.filter((item) => ['delivered', 'completed'].includes((item.status || '').toLowerCase())),
    [history]
  );

  const totalEarnings = useMemo(
    () => delivered.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    [delivered]
  );

  const monthlySummary = useMemo(() => {
    const map = new Map();

    delivered.forEach((item) => {
      const key = monthKey(item.updatedAt || item.createdAt);
      map.set(key, (map.get(key) || 0) + Number(item.totalAmount || 0));
    });

    return Array.from(map.entries())
      .map(([label, amount]) => ({ label, amount }))
      .slice(-6);
  }, [delivered]);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View>
        <Text style={styles.orderId}>#{item.orderNumber}</Text>
        <Text style={styles.txDate}>{formatDate(item.updatedAt || item.createdAt, 'datetime')}</Text>
      </View>
      <Text style={styles.txAmount}>+{formatCurrency(item.totalAmount)}</Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading earnings..." />;
  }

  return (
    <FlatList
      style={styles.container}
      data={delivered}
      renderItem={renderTransaction}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
      ListHeaderComponent={
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.primaryCard]}>
              <Text style={styles.summaryLabelLight}>Total Earnings</Text>
              <Text style={styles.summaryValueLight}>{formatCurrency(totalEarnings)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={styles.summaryValue}>{formatNumber(delivered.length)}</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Last 6 Months</Text>
            {monthlySummary.length === 0 ? (
              <Text style={styles.chartEmpty}>No completed delivery earnings yet.</Text>
            ) : (
              monthlySummary.map((entry) => (
                <View key={entry.label} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{entry.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(
                            10,
                            (entry.amount / Math.max(...monthlySummary.map((item) => item.amount), 1)) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{formatCurrency(entry.amount)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {error ? (
              <TouchableOpacity onPress={() => loadHistory(false)}>
                <Text style={styles.retryInline}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="account-balance-wallet" size={46} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>{error ? 'Unable to load earnings' : 'No earnings available yet'}</Text>
          <Text style={styles.emptyText}>{error || 'Delivered orders will show up as transactions here.'}</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  primaryCard: { backgroundColor: '#2E7D32' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 12 },
  summaryValue: { marginTop: 6, color: Colors.text, fontWeight: '700', fontSize: 20 },
  summaryLabelLight: { color: '#E8F5E9', fontSize: 12 },
  summaryValueLight: { marginTop: 6, color: Colors.white, fontWeight: '700', fontSize: 20 },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  retryInline: { color: '#1565C0', fontWeight: '700', fontSize: 12 },
  chartEmpty: { marginTop: 8, color: Colors.textSecondary, fontSize: 13 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  chartLabel: { width: 48, fontSize: 12, color: Colors.textSecondary },
  barTrack: { flex: 1, height: 10, borderRadius: 8, backgroundColor: '#E8EEF5', marginHorizontal: 8, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#1565C0' },
  chartValue: { width: 84, textAlign: 'right', fontSize: 11, color: Colors.textSecondary },
  transactionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  orderId: { color: Colors.text, fontWeight: '700', fontSize: 13 },
  txDate: { marginTop: 4, color: Colors.textSecondary, fontSize: 12 },
  txAmount: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 70, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { marginTop: 8, fontSize: 14, textAlign: 'center', color: Colors.textSecondary },
});

export default TransportEarningsScreen;
