import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DeliveryHistoryScreen = ({ navigation }) => {
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
      console.error('Failed to load delivery history:', err);
      setError(err.message || 'Failed to load delivery history');
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

  const openDeliveryDetail = (item) => {
    if (!item?.id) return;
    navigation.navigate('DeliveryDetail', { deliveryId: item.id });
  };

  const totalEarnings = history
    .filter((item) => ['delivered', 'completed'].includes((item.status || '').toLowerCase()))
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDeliveryDetail(item)} activeOpacity={0.85}>
      <View style={styles.rowBetween}>
        <Text style={styles.orderNo}>#{item.orderNumber}</Text>
        <StatusBadge status={item.statusLabel} size="small" />
      </View>

      <Text style={styles.crop}>{item.cropName}</Text>

      <View style={styles.routeRow}>
        <MaterialIcons name="radio-button-checked" size={14} color="#2E7D32" />
        <Text style={styles.routeText}>{item.pickupCity || 'Pickup'}</Text>
        <MaterialIcons name="arrow-forward" size={14} color={Colors.textSecondary} />
        <MaterialIcons name="location-on" size={14} color="#D32F2F" />
        <Text style={styles.routeText}>{item.deliveryCity || 'Destination'}</Text>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.meta}>{formatDate(item.updatedAt || item.createdAt, 'datetime')}</Text>
        <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="Loading delivery history..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Completed Deliveries</Text>
          <Text style={styles.summaryValue}>{history.length}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalEarnings)}</Text>
        </View>
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={46} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>{error ? 'Failed to load history' : 'No delivery history yet'}</Text>
            <Text style={styles.emptyText}>{error || 'Completed deliveries will appear here.'}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadHistory()}>
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
  summaryCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 1,
  },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1565C0' },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  crop: { marginTop: 8, fontSize: 15, color: Colors.text, fontWeight: '600' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  routeText: { marginHorizontal: 4, color: Colors.text, fontSize: 13 },
  meta: { marginTop: 10, color: Colors.textSecondary, fontSize: 12 },
  amount: { marginTop: 10, color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 90, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { marginTop: 8, fontSize: 14, textAlign: 'center', color: Colors.textSecondary },
  retryBtn: { marginTop: 16, backgroundColor: '#1565C0', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});

export default DeliveryHistoryScreen;
