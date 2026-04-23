/**
 * Trader Dashboard Screen
 * Shows trader stats and quick navigation
 * NO DEMO DATA - All data from real backend
 */

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
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import proposalService from '../../services/proposalService';
import cropService from '../../services/cropService';
import apiService from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import { formatCurrency } from '../../utils/formatters';

const TraderDashboardScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const handleLogout = async () => {
  await logout();
};
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pendingProposals: 0,
    acceptedProposals: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    availableCrops: 0,
  });

  const loadDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      // Fetch data in parallel
      const [proposalStats, orders, availableCrops] = await Promise.allSettled([
        proposalService.getProposalStats().catch(() => null),
        apiService.get(API_ENDPOINTS.ORDERS.TRADER_ORDERS).catch(() => ({ orders: [] })),
        cropService.getAvailableCrops({}).catch(() => ({ crops: [] })),
      ]);

      // Process proposal stats
      const proposalData = proposalStats.status === 'fulfilled' && proposalStats.value
        ? proposalStats.value.stats || proposalStats.value
        : {};

      // Process orders
      const ordersData = orders.status === 'fulfilled' && orders.value
        ? (orders.value.orders || orders.value.data || [])
        : [];

      const activeOrders = ordersData.filter(o =>
        !['Completed', 'Cancelled', 'Delivered'].includes(o.status)
      ).length;

      const completedOrders = ordersData.filter(o =>
        ['Completed', 'Delivered'].includes(o.status)
      ).length;

      // Calculate total spent
      const totalSpent = ordersData
        .filter(o => ['Completed', 'Delivered'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Process available crops count
      const availableCropsData = availableCrops.status === 'fulfilled' && availableCrops.value
        ? (availableCrops.value.crops || availableCrops.value.data || [])
        : [];

      setStats({
        pendingProposals: proposalData.pending || 0,
        acceptedProposals: proposalData.accepted || 0,
        activeOrders,
        completedOrders,
        totalSpent,
        availableCrops: availableCropsData.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused, loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, [loadDashboardData]);

  const featureCards = [
    {
      title: t('trader.dashboard.kycVerification'),
      description: t('trader.dashboard.kycVerificationDescription'),
      icon: 'description',
      color: '#1565C0',
      screen: 'KYC',
    },
    {
      title: t('trader.dashboard.browseCrops'),
      description: t('trader.dashboard.browseCropsDescription'),
      icon: 'assignment-turned-in',
      color: '#2E7D32',
      screen: 'BrowseCrops',
    },
    {
      title: t('trader.dashboard.myProposals'),
      description: t('trader.dashboard.myProposalsDescription'),
      icon: 'chat',
      color: '#E65100',
      screen: 'MyProposals',
    },
    {
      title: t('trader.dashboard.myOrders'),
      description: t('trader.dashboard.myOrdersDescription'),
      icon: 'shopping-cart',
      color: '#1565C0',
      screen: 'MyOrders',
    },
    {
      title: t('trader.dashboard.payments'),
      description: t('trader.dashboard.paymentsDescription'),
      icon: 'account-balance-wallet',
      color: '#D32F2F',
      screen: 'Payments',
    },
    {
      title: t('trader.dashboard.marketAnalytics'),
      description: t('trader.dashboard.marketAnalyticsDescription'),
      icon: 'bar-chart',
      color: '#6A1B9A',
      screen: 'Analytics',
    },
    {
      title: t('trader.dashboard.farmerNetwork'),
      description: t('trader.dashboard.farmerNetworkDescription'),
      icon: 'people',
      color: '#757575',
      screen: 'FarmerNetwork',
    },
  ];

  const getActionButtonText = (title) => {
    if (title === t('trader.dashboard.kycVerification')) return t('trader.dashboard.verifyKYC');
    if (title === t('trader.dashboard.browseCrops')) return t('trader.dashboard.browseNow');
    if (title === t('trader.dashboard.myProposals')) return t('trader.dashboard.viewProposals');
    if (title === t('trader.dashboard.myOrders')) return t('trader.dashboard.trackOrders');
    if (title === t('trader.dashboard.payments')) return t('trader.dashboard.managePayments');
    if (title === t('trader.dashboard.marketAnalytics')) return t('trader.dashboard.viewAnalytics');
    return t('trader.dashboard.connectNow');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E65100']} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>
              {t('trader.dashboard.title')}{user?.name ? `, ${user.name}` : ''}
            </Text>
            <Text style={styles.roleText}>🏪 Trader</Text>
            <Text style={styles.welcomeDescription}>
              {t('trader.dashboard.description')}
            </Text>
          </View>
          <View style={styles.headerActions}>
           <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <MaterialIcons name="power-settings-new" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate('MyProposals')}
          >
            <MaterialIcons name="send" size={24} color="#E65100" />
            <Text style={styles.statValue}>{stats.pendingProposals}</Text>
            <Text style={styles.statLabel}>Pending Proposals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}
            onPress={() => navigation.navigate('MyOrders')}
          >
            <MaterialIcons name="check-circle" size={24} color="#2E7D32" />
            <Text style={styles.statValue}>{stats.activeOrders}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}
            onPress={() => navigation.navigate('BrowseCrops')}
          >
            <MaterialIcons name="agriculture" size={24} color="#1565C0" />
            <Text style={styles.statValue}>{stats.availableCrops}</Text>
            <Text style={styles.statLabel}>Available Crops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}
            onPress={() => navigation.navigate('Payments')}
          >
            <MaterialIcons name="account-balance-wallet" size={24} color="#6A1B9A" />
            <Text style={styles.statValue}>{formatCurrency(stats.totalSpent)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('BrowseCrops')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#2E7D32' + '20' }]}>
              <MaterialIcons name="search" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.quickActionText}>Find Crops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyProposals')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E65100' + '20' }]}>
              <MaterialIcons name="assignment" size={22} color="#E65100" />
            </View>
            <Text style={styles.quickActionText}>Proposals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyOrders')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#1565C0' + '20' }]}>
              <MaterialIcons name="receipt-long" size={22} color="#1565C0" />
            </View>
            <Text style={styles.quickActionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6A1B9A' + '20' }]}>
              <MaterialIcons name="trending-up" size={22} color="#6A1B9A" />
            </View>
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature Cards Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Features</Text>
      </View>
      <View style={styles.featuresGrid}>
        {featureCards.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, { borderColor: feature.color + '30' }]}
            onPress={() => navigation.navigate(feature.screen)}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
              <MaterialIcons name={feature.icon} size={28} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <Text style={styles.actionButtonText}>
                {getActionButtonText(feature.title)}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeSection: {
    backgroundColor: '#E65100',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.85,
    marginBottom: 6,
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  headerActions: {
    marginLeft: 8,
    marginTop: 4,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  featureCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: '2%',
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TraderDashboardScreen;
