import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import adminService from '../../services/adminService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';

const ADMIN_COLOR = '#512DA8';

const rowToMap = (rows = []) => {
  return rows.reduce((acc, row) => {
    const key = row?._id || 'unknown';
    acc[key] = Number(row?.count || 0);
    return acc;
  }, {});
};

const StatBox = ({ label, value, icon }) => (
  <View style={styles.statBox}>
    <View style={styles.statIconWrap}>
      <MaterialIcons name={icon} size={18} color={ADMIN_COLOR} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AdminDashboardScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totals: {},
    usersByRole: [],
    usersByAccountStatus: [],
    ordersByStatus: [],
    proposalsByStatus: [],
    disputesByStatus: [],
    finance: {},
    last7Days: {},
  });

  const loadStats = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await adminService.getStats();
      setStats({
        totals: response?.totals || {},
        usersByRole: response?.usersByRole || [],
        usersByAccountStatus: response?.usersByAccountStatus || [],
        ordersByStatus: response?.ordersByStatus || [],
        proposalsByStatus: response?.proposalsByStatus || [],
        disputesByStatus: response?.disputesByStatus || [],
        finance: response?.finance || {},
        last7Days: response?.last7Days || {},
      });
    } catch (statsError) {
      console.error('Admin dashboard load error:', statsError);
      setError(statsError.message || 'Failed to load admin dashboard');
      setStats({
        totals: {},
        usersByRole: [],
        usersByAccountStatus: [],
        ordersByStatus: [],
        proposalsByStatus: [],
        disputesByStatus: [],
        finance: {},
        last7Days: {},
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused, loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats(false);
  }, [loadStats]);

  const userRoleMap = useMemo(() => rowToMap(stats.usersByRole), [stats.usersByRole]);
  const accountStatusMap = useMemo(() => rowToMap(stats.usersByAccountStatus), [stats.usersByAccountStatus]);
  const orderStatusMap = useMemo(() => rowToMap(stats.ordersByStatus), [stats.ordersByStatus]);
  const disputeStatusMap = useMemo(() => rowToMap(stats.disputesByStatus), [stats.disputesByStatus]);

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Admin Control Center</Text>
        <Text style={styles.headerText}>
          Platform health, moderation snapshot, and operational insights.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatBox label="Users" value={stats.totals.users || 0} icon="groups" />
        <StatBox label="Crops" value={stats.totals.crops || 0} icon="grass" />
        <StatBox label="Proposals" value={stats.totals.proposals || 0} icon="request-page" />
        <StatBox label="Orders" value={stats.totals.orders || 0} icon="receipt-long" />
        <StatBox label="Agreements" value={stats.totals.agreements || 0} icon="gavel" />
        <StatBox label="Disputes" value={stats.totals.disputes || 0} icon="report-problem" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Financial Snapshot</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Total Trade Value</Text>
          <Text style={styles.metaValue}>{formatCurrency(stats.finance.totalTradeValue || 0)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.metaLabel}>Completed Payments</Text>
          <Text style={styles.metaValue}>{formatCurrency(stats.finance.totalCompletedTransactionAmount || 0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>User Distribution</Text>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Farmers</Text><Text style={styles.metaValue}>{userRoleMap.farmer || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Traders</Text><Text style={styles.metaValue}>{userRoleMap.trader || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Transporters</Text><Text style={styles.metaValue}>{userRoleMap.transport || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Admins</Text><Text style={styles.metaValue}>{userRoleMap.admin || 0}</Text></View>
        <View style={styles.divider} />
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Active</Text><Text style={styles.metaValue}>{accountStatusMap.active || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Suspended</Text><Text style={styles.metaValue}>{accountStatusMap.suspended || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Banned</Text><Text style={styles.metaValue}>{accountStatusMap.banned || 0}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Operations Snapshot</Text>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Orders In Transit</Text><Text style={styles.metaValue}>{orderStatusMap.in_transit || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Orders Completed</Text><Text style={styles.metaValue}>{orderStatusMap.completed || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Open Disputes</Text><Text style={styles.metaValue}>{(disputeStatusMap.open || 0) + (disputeStatusMap.in_review || 0)}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Resolved Disputes</Text><Text style={styles.metaValue}>{disputeStatusMap.resolved || 0}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Last 7 Days</Text>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>New Users</Text><Text style={styles.metaValue}>{stats.last7Days.newUsers || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>New Crops</Text><Text style={styles.metaValue}>{stats.last7Days.newCrops || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>New Proposals</Text><Text style={styles.metaValue}>{stats.last7Days.newProposals || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>New Orders</Text><Text style={styles.metaValue}>{stats.last7Days.newOrders || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>New Disputes</Text><Text style={styles.metaValue}>{stats.last7Days.newDisputes || 0}</Text></View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#EDE7F6',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 10,
  },
  statBox: {
    width: '33.33%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
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
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
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

export default AdminDashboardScreen;
