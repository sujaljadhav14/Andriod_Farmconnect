import React, { useState, useEffect, useCallback } from 'react';
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
import transactionService from '../../services/transactionService';
import agreementService from '../../services/agreementService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const AdminPaymentsAgreementsScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    completedAmount: 0,
  });
  const [agreementStats, setAgreementStats] = useState({
    totalAgreements: 0,
    completedAgreements: 0,
    pendingAgreements: 0,
    cancelledAgreements: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [agreements, setAgreements] = useState([]);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const [txRes, txStatsRes, agreementsRes, agreementStatsRes] = await Promise.all([
        transactionService.getMyTransactions({ limit: 25 }),
        transactionService.getTransactionStats(),
        agreementService.getAgreements({ limit: 25 }),
        agreementService.getAgreementStats(),
      ]);

      setTransactions(txRes?.transactions || []);
      setAgreements(agreementsRes?.agreements || []);
      setTransactionStats(
        txStatsRes?.overall || {
          totalTransactions: 0,
          totalAmount: 0,
          completedAmount: 0,
        }
      );
      setAgreementStats(
        agreementStatsRes?.overall || {
          totalAgreements: 0,
          completedAgreements: 0,
          pendingAgreements: 0,
          cancelledAgreements: 0,
        }
      );
    } catch (err) {
      console.error('Admin payment/agreement load error:', err);
      setError(err.message || 'Failed to load admin monitoring data');
      setTransactions([]);
      setAgreements([]);
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

  if (loading) {
    return <LoadingSpinner text="Loading admin monitor..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#512DA8']} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Admin Payments and Agreements Monitor</Text>
        <Text style={styles.headerText}>
          Central view of transaction activity and legal agreement completion across the platform.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Transactions</Text>
          <Text style={styles.statValue}>{transactionStats.totalTransactions || 0}</Text>
          <Text style={styles.statSubText}>{formatCurrency(transactionStats.totalAmount || 0)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed Payments</Text>
          <Text style={styles.statValue}>{formatCurrency(transactionStats.completedAmount || 0)}</Text>
          <Text style={styles.statSubText}>Settled amount</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Agreements</Text>
          <Text style={styles.statValue}>{agreementStats.totalAgreements || 0}</Text>
          <Text style={styles.statSubText}>Legal docs generated</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Signatures</Text>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{agreementStats.pendingAgreements || 0}</Text>
          <Text style={styles.statSubText}>Need action</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Latest Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions available.</Text>
        ) : (
          transactions.slice(0, 15).map((transaction) => (
            <View key={transaction.id} style={styles.listRow}>
              <View style={styles.listLeft}>
                <Text style={styles.listTitle}>{transaction.referenceNumber || 'N/A'}</Text>
                <Text style={styles.listMeta}>Order #{transaction.orderNumber || '-'}</Text>
                <Text style={styles.listMeta}>{formatDate(transaction.createdAt)}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listAmount}>{formatCurrency(transaction.amount || 0)}</Text>
                <Text
                  style={[
                    styles.statusText,
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Latest Agreements</Text>
        {agreements.length === 0 ? (
          <Text style={styles.emptyText}>No agreements available.</Text>
        ) : (
          agreements.slice(0, 15).map((agreement) => (
            <View key={agreement.id} style={styles.listRow}>
              <View style={styles.listLeft}>
                <Text style={styles.listTitle}>{agreement.documentNumber || 'Agreement'}</Text>
                <Text style={styles.listMeta}>Order #{agreement.orderNumber || '-'}</Text>
                <Text style={styles.listMeta}>Farmer Signed: {agreement.farmerSignature?.signed ? 'Yes' : 'No'}</Text>
                <Text style={styles.listMeta}>Trader Signed: {agreement.traderSignature?.signed ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.listRight}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        agreement.statusRaw === 'completed'
                          ? Colors.success
                          : agreement.statusRaw === 'cancelled'
                            ? Colors.error
                            : Colors.warning,
                    },
                  ]}
                >
                  {agreement.status}
                </Text>
                <TouchableOpacity style={styles.tagButton}>
                  <MaterialIcons name="verified-user" size={16} color="#512DA8" />
                  <Text style={styles.tagButtonText}>Monitor</Text>
                </TouchableOpacity>
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
    backgroundColor: '#512DA8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#F3E5F5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 12,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  listMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  listAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#512DA8',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#512DA8',
    marginLeft: 4,
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
    flex: 1,
    fontSize: 12,
    color: Colors.error,
    marginLeft: 8,
  },
});

export default AdminPaymentsAgreementsScreen;
