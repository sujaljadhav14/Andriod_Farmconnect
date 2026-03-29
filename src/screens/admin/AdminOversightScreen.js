import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ADMIN_COLOR = '#512DA8';
const VIEWS = ['orders', 'crops', 'proposals', 'deliveries'];

const AdminOversightScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedView, setSelectedView] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const [ordersRes, cropsRes, proposalsRes, deliveriesRes] = await Promise.all([
        adminService.getOrders({ limit: 30 }),
        adminService.getCrops({ limit: 30 }),
        adminService.getProposals({ limit: 30 }),
        adminService.getDeliveries({ limit: 30 }),
      ]);

      setOrders(ordersRes?.data || []);
      setCrops(cropsRes?.data || []);
      setProposals(proposalsRes?.data || []);
      setDeliveries(deliveriesRes?.data || []);
    } catch (loadError) {
      console.error('Admin oversight load error:', loadError);
      setError(loadError.message || 'Failed to load oversight data');
      setOrders([]);
      setCrops([]);
      setProposals([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const selectedData = useMemo(() => {
    if (selectedView === 'orders') return orders;
    if (selectedView === 'crops') return crops;
    if (selectedView === 'proposals') return proposals;
    return deliveries;
  }, [selectedView, orders, crops, proposals, deliveries]);

  if (loading) {
    return <LoadingSpinner text="Loading platform oversight..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Platform Oversight</Text>
        <Text style={styles.headerText}>Unified monitoring for orders, crop listings, proposals, and active deliveries.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Orders</Text><Text style={styles.summaryValue}>{orders.length}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Crops</Text><Text style={styles.summaryValue}>{crops.length}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Proposals</Text><Text style={styles.summaryValue}>{proposals.length}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Deliveries</Text><Text style={styles.summaryValue}>{deliveries.length}</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {VIEWS.map((view) => {
          const selected = selectedView === view;
          return (
            <TouchableOpacity
              key={view}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setSelectedView(view)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Latest {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)}</Text>

        {selectedData.length === 0 ? (
          <Text style={styles.emptyText}>No records available.</Text>
        ) : (
          selectedData.slice(0, 25).map((item) => {
            if (selectedView === 'orders') {
              return (
                <View key={item._id || item.id} style={styles.listRow}>
                  <View style={styles.listLeft}>
                    <Text style={styles.listTitle}>{item.orderNumber || 'Order'}</Text>
                    <Text style={styles.listMeta}>Farmer: {item.farmerId?.name || '-'}</Text>
                    <Text style={styles.listMeta}>Trader: {item.traderId?.name || '-'}</Text>
                    <Text style={styles.listMeta}>Updated: {formatDate(item.updatedAt, 'short')}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>{formatCurrency(item.totalAmount || 0)}</Text>
                    <Text style={styles.statusText}>{item.status || '-'}</Text>
                  </View>
                </View>
              );
            }

            if (selectedView === 'crops') {
              return (
                <View key={item._id || item.id} style={styles.listRow}>
                  <View style={styles.listLeft}>
                    <Text style={styles.listTitle}>{item.cropName || 'Crop'}</Text>
                    <Text style={styles.listMeta}>Farmer: {item.farmerName || item.farmerId?.name || '-'}</Text>
                    <Text style={styles.listMeta}>Category: {item.category || '-'}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>{formatCurrency(item.price || 0)}</Text>
                    <Text style={styles.statusText}>{item.status || '-'}</Text>
                  </View>
                </View>
              );
            }

            if (selectedView === 'proposals') {
              return (
                <View key={item._id || item.id} style={styles.listRow}>
                  <View style={styles.listLeft}>
                    <Text style={styles.listTitle}>{item.cropId?.cropName || 'Proposal'}</Text>
                    <Text style={styles.listMeta}>Farmer: {item.farmerId?.name || '-'}</Text>
                    <Text style={styles.listMeta}>Trader: {item.traderId?.name || '-'}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listAmount}>{formatCurrency(item.totalAmount || 0)}</Text>
                    <Text style={styles.statusText}>{item.status || '-'}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={item._id || item.id} style={styles.listRow}>
                <View style={styles.listLeft}>
                  <Text style={styles.listTitle}>{item.orderNumber || 'Delivery'}</Text>
                  <Text style={styles.listMeta}>Driver: {item.transportDetails?.driverId?.name || '-'}</Text>
                  <Text style={styles.listMeta}>Route: {item.deliveryDetails?.city || '-'}, {item.deliveryDetails?.state || '-'}</Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listAmount}>{formatCurrency(item.totalAmount || 0)}</Text>
                  <Text style={styles.statusText}>{item.status || '-'}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  headerCard: {
    backgroundColor: ADMIN_COLOR,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EDE7F6',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: ADMIN_COLOR,
    backgroundColor: '#EDE7F6',
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: ADMIN_COLOR,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  listLeft: {
    flex: 1,
    marginRight: 10,
  },
  listRight: {
    alignItems: 'flex-end',
  },
  listTitle: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  listMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  listAmount: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 3,
    fontSize: 11,
    color: ADMIN_COLOR,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
});

export default AdminOversightScreen;
