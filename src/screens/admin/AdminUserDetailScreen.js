import React, { useCallback, useEffect, useState } from 'react';
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
import { formatCurrency, formatDate } from '../../utils/formatters';

const ADMIN_COLOR = '#512DA8';

const AdminUserDetailScreen = ({ route }) => {
  const isFocused = useIsFocused();
  const { userId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState({
    user: null,
    activity: {},
    recentTransactions: [],
  });

  const loadDetails = useCallback(async (showLoader = true) => {
    if (!userId) {
      setError('Missing userId');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await adminService.getUserDetails(userId);
      setDetails({
        user: response?.user || null,
        activity: response?.activity || {},
        recentTransactions: response?.recentTransactions || [],
      });
    } catch (detailError) {
      console.error('Admin user detail load error:', detailError);
      setError(detailError.message || 'Failed to load user details');
      setDetails({ user: null, activity: {}, recentTransactions: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isFocused) {
      loadDetails();
    }
  }, [isFocused, loadDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDetails(false);
  }, [loadDetails]);

  if (loading) {
    return <LoadingSpinner text="Loading user details..." />;
  }

  const user = details.user || {};
  const activity = details.activity || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ADMIN_COLOR]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>{user.name || 'User Details'}</Text>
        <Text style={styles.headerText}>{user.phone || '-'} • {user.role || '-'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Profile</Text>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Status</Text><Text style={styles.metaValue}>{user.accountStatus || 'active'}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>KYC</Text><Text style={styles.metaValue}>{user.kycStatus || 'pending'}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Verified</Text><Text style={styles.metaValue}>{user.isVerified ? 'Yes' : 'No'}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Joined</Text><Text style={styles.metaValue}>{user.createdAt ? formatDate(user.createdAt, 'short') : '-'}</Text></View>
        {!!user.accountStatusReason && user.accountStatus !== 'active' && (
          <Text style={styles.reasonText}>Reason: {user.accountStatusReason}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Activity Overview</Text>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Crops</Text><Text style={styles.metaValue}>{activity.cropsCount || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Proposals (Trader)</Text><Text style={styles.metaValue}>{activity.proposalsAsTrader || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Proposals (Farmer)</Text><Text style={styles.metaValue}>{activity.proposalsAsFarmer || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Orders (Trader)</Text><Text style={styles.metaValue}>{activity.ordersAsTrader || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Orders (Farmer)</Text><Text style={styles.metaValue}>{activity.ordersAsFarmer || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Deliveries</Text><Text style={styles.metaValue}>{activity.deliveriesCount || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Disputes Raised</Text><Text style={styles.metaValue}>{activity.disputesRaised || 0}</Text></View>
        <View style={styles.rowBetween}><Text style={styles.metaLabel}>Disputes Against</Text><Text style={styles.metaValue}>{activity.disputesAgainst || 0}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {details.recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No recent transactions.</Text>
        ) : (
          details.recentTransactions.map((tx) => (
            <View key={tx._id || tx.referenceNumber} style={styles.listRow}>
              <View style={styles.listLeft}>
                <Text style={styles.listTitle}>{tx.referenceNumber || 'Transaction'}</Text>
                <Text style={styles.listMeta}>{tx.paymentMethod || 'method unknown'}</Text>
                <Text style={styles.listMeta}>{tx.createdAt ? formatDate(tx.createdAt, 'short') : '-'}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listAmount}>{formatCurrency(tx.amount || 0)}</Text>
                <Text style={styles.listStatus}>{tx.status || '-'}</Text>
              </View>
            </View>
          ))
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerText: {
    marginTop: 5,
    fontSize: 12,
    color: '#EDE7F6',
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  reasonText: {
    marginTop: 8,
    color: Colors.error,
    fontSize: 12,
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
  listStatus: {
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

export default AdminUserDetailScreen;
