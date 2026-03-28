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
import orderService from '../../services/orderService';
import transactionService from '../../services/transactionService';
import agreementService from '../../services/agreementService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const FarmerPaymentsScreen = ({ navigation }) => {
    const isFocused = useIsFocused();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [summary, setSummary] = useState({
        totalOrderValue: 0,
        totalReceived: 0,
        pendingReceivables: 0,
        completedDeals: 0,
    });
    const [pendingOrders, setPendingOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [agreements, setAgreements] = useState([]);
    const [agreementOverview, setAgreementOverview] = useState({
        totalAgreements: 0,
        completedAgreements: 0,
        pendingAgreements: 0,
        cancelledAgreements: 0,
    });

    const loadData = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        setError('');

        try {
            const [ordersRes, txRes, txStatsRes, agreementsRes, agreementStatsRes] = await Promise.all([
                orderService.getFarmerOrders(),
                transactionService.getMyTransactions({ limit: 20 }),
                transactionService.getTransactionStats(),
                agreementService.getAgreements({ limit: 20 }),
                agreementService.getAgreementStats(),
            ]);

            const orders = orderService.normalizeOrders(ordersRes?.orders || ordersRes?.data || []);
            const normalizedTransactions = txRes?.transactions || [];
            const normalizedAgreements = agreementsRes?.agreements || [];

            const payableOrders = orders.filter((order) => order.status !== 'Cancelled');
            const totalOrderValue = payableOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
            const totalReceived = payableOrders.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0);
            const pendingReceivables = Math.max(totalOrderValue - totalReceived, 0);

            const pendingPaymentOrders = payableOrders
                .map((order) => ({
                    ...order,
                    dueAmount: Math.max(Number(order.totalAmount || 0) - Number(order.paidAmount || 0), 0),
                }))
                .filter((order) => order.dueAmount > 0)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const completedDeals = normalizedAgreements.filter((agreement) => agreement.statusRaw === 'completed').length;

            setSummary({
                totalOrderValue,
                totalReceived,
                pendingReceivables,
                completedDeals,
            });
            setPendingOrders(pendingPaymentOrders);
            setTransactions(normalizedTransactions);
            setAgreements(normalizedAgreements);
            setAgreementOverview(
                agreementStatsRes?.overall || {
                    totalAgreements: 0,
                    completedAgreements: 0,
                    pendingAgreements: 0,
                    cancelledAgreements: 0,
                }
            );

            if (!txStatsRes?.overall && normalizedTransactions.length === 0) {
                setError('No payment transactions found yet.');
            }
        } catch (err) {
            console.error('Farmer payments load error:', err);
            setError(err.message || 'Failed to load payments and earnings');
            setPendingOrders([]);
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
        return <LoadingSpinner text="Loading earnings..." />;
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
            <View style={styles.summaryCard}>
                <Text style={styles.title}>Earnings and Payments</Text>
                <Text style={styles.description}>
                    Track received payments, pending receivables, and legal agreement completion.
                </Text>

                <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Order Value</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.totalOrderValue)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Received</Text>
                        <Text style={[styles.summaryValue, { color: Colors.success }]}>{formatCurrency(summary.totalReceived)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Pending</Text>
                        <Text style={[styles.summaryValue, { color: Colors.warning }]}>{formatCurrency(summary.pendingReceivables)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Completed Deals</Text>
                        <Text style={styles.summaryValue}>{summary.completedDeals}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Pending Receivables</Text>
                {pendingOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No pending receivables. All current deals are settled.</Text>
                ) : (
                    pendingOrders.slice(0, 10).map((order) => (
                        <View key={order.id} style={styles.listItem}>
                            <View style={styles.listItemLeft}>
                                <Text style={styles.listTitle}>#{order.orderNumber}</Text>
                                <Text style={styles.listSubTitle}>{order.crop?.cropName || 'Order'}</Text>
                                <Text style={styles.listMeta}>Trader: {order.trader?.name || 'Trader'}</Text>
                            </View>
                            <View style={styles.listItemRight}>
                                <Text style={styles.pendingAmount}>{formatCurrency(order.dueAmount)}</Text>
                                <TouchableOpacity
                                    style={styles.viewButton}
                                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                >
                                    <Text style={styles.viewButtonText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Recent Receipts</Text>
                {transactions.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions yet.</Text>
                ) : (
                    transactions.slice(0, 10).map((transaction) => (
                        <View key={transaction.id} style={styles.transactionRow}>
                            <View style={styles.listItemLeft}>
                                <Text style={styles.listTitle}>{transaction.referenceNumber || 'N/A'}</Text>
                                <Text style={styles.listMeta}>Order #{transaction.orderNumber || '-'}</Text>
                                <Text style={styles.listMeta}>{formatDate(transaction.createdAt)}</Text>
                            </View>
                            <View style={styles.listItemRight}>
                                <Text style={styles.receivedAmount}>{formatCurrency(transaction.amount || 0)}</Text>
                                <Text style={styles.transactionStatus}>{transaction.status}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Legal Agreements</Text>
                <View style={styles.agreementStatsRow}>
                    <Text style={styles.listMeta}>Total: {agreementOverview.totalAgreements || 0}</Text>
                    <Text style={[styles.listMeta, { color: Colors.success }]}>Completed: {agreementOverview.completedAgreements || 0}</Text>
                    <Text style={[styles.listMeta, { color: Colors.warning }]}>Pending: {agreementOverview.pendingAgreements || 0}</Text>
                </View>

                {agreements.length === 0 ? (
                    <Text style={styles.emptyText}>No agreements generated yet.</Text>
                ) : (
                    agreements.slice(0, 10).map((agreement) => (
                        <View key={agreement.id} style={styles.listItem}>
                            <View style={styles.listItemLeft}>
                                <Text style={styles.listTitle}>{agreement.documentNumber || 'Agreement'}</Text>
                                <Text style={styles.listSubTitle}>Order #{agreement.orderNumber || '-'}</Text>
                                <Text style={styles.listMeta}>{agreement.status}</Text>
                            </View>
                            <View style={styles.listItemRight}>
                                <TouchableOpacity
                                    style={styles.viewButton}
                                    onPress={() => navigation.navigate('OrderDetail', { orderId: agreement.orderId })}
                                >
                                    <Text style={styles.viewButtonText}>Open</Text>
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
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    summaryItem: {
        width: '50%',
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
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
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#FAFAFA',
    },
    listItemLeft: {
        flex: 1,
        marginRight: 10,
    },
    listItemRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    listTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    listSubTitle: {
        fontSize: 12,
        color: Colors.text,
        marginBottom: 2,
    },
    listMeta: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    pendingAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.warning,
        marginBottom: 6,
    },
    receivedAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.success,
    },
    transactionStatus: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    viewButton: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: 10,
    },
    agreementStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
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

export default FarmerPaymentsScreen;
