/**
 * Farmer Dashboard Screen
 * Shows farmer stats and quick navigation
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import cropService from '../../services/cropService';
import proposalService from '../../services/proposalService';
import apiService from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import { formatCurrency } from '../../utils/formatters';

const FarmerDashboardScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeCrops: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    pendingProposals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const loadDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      // Fetch data in parallel
      const [cropsRes, proposalsRes, ordersRes] = await Promise.allSettled([
        cropService.getMyCrops().catch(() => ({ crops: [] })),
        proposalService.getFarmerProposals().catch(() => ({ proposals: [] })),
        apiService.get(API_ENDPOINTS.ORDERS.FARMER_ORDERS).catch(() => ({ orders: [] })),
      ]);

      // Process crops
      const crops = cropsRes.status === 'fulfilled' && cropsRes.value
        ? (cropsRes.value.crops || cropsRes.value.data || [])
        : [];
      const totalCrops = crops.length;
      const activeCrops = crops.filter(c => c.status === 'Available').length;

      // Process proposals
      const proposals = proposalsRes.status === 'fulfilled' && proposalsRes.value
        ? (proposalsRes.value.proposals || proposalsRes.value.data || [])
        : [];
      const pendingProposals = proposals.filter(p =>
        p.status?.toLowerCase() === 'pending'
      ).length;

      // Process orders
      const orders = ordersRes.status === 'fulfilled' && ordersRes.value
        ? (ordersRes.value.orders || ordersRes.value.data || [])
        : [];
      const pendingOrders = orders.filter(o =>
        !['Completed', 'Cancelled', 'Delivered'].includes(o.status)
      ).length;
      const completedOrders = orders.filter(o =>
        ['Completed', 'Delivered'].includes(o.status)
      ).length;

      // Calculate total earnings
      const totalEarnings = orders
        .filter(o => ['Completed', 'Delivered'].includes(o.status))
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalCrops,
        activeCrops,
        pendingOrders,
        completedOrders,
        totalEarnings,
        pendingProposals,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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

  const statCards = [
    {
      title: t('farmer.dashboard.totalCrops'),
      value: stats.totalCrops,
      icon: 'grass',
      color: '#2E7D32',
      screen: 'MyCrops',
    },
    {
      title: t('farmer.dashboard.activeListings'),
      value: stats.activeCrops,
      icon: 'trending-up',
      color: '#1565C0',
      screen: 'MyCrops',
    },
    {
      title: t('farmer.dashboard.pendingOrders'),
      value: stats.pendingOrders,
      icon: 'hourglass-empty',
      color: '#E65100',
      screen: 'MyOrders',
    },
    {
      title: t('farmer.dashboard.totalEarnings'),
      value: formatCurrency(stats.totalEarnings),
      icon: 'account-balance-wallet',
      color: '#6A1B9A',
      screen: 'Payments',
    },
  ];

  const featureCards = [
    {
      title: t('farmer.dashboard.myCrops'),
      description: t('farmer.dashboard.myCropsDescription'),
      icon: 'grass',
      color: '#2E7D32',
      screen: 'MyCrops',
    },
    {
      title: t('farmer.dashboard.myOrders'),
      description: t('farmer.dashboard.myOrdersDescription'),
      icon: 'shopping-cart',
      color: '#E65100',
      screen: 'MyOrders',
    },
    {
      title: t('farmer.dashboard.weatherUpdates'),
      description: t('farmer.dashboard.weatherUpdatesDescription'),
      icon: 'wb-sunny',
      color: '#1565C0',
      screen: 'Weather',
    },
    {
      title: t('farmer.dashboard.marketPrices'),
      description: t('farmer.dashboard.marketPricesDescription'),
      icon: 'bar-chart',
      color: '#6A1B9A',
      screen: 'MarketPrices',
    },
    {
      title: t('farmer.dashboard.addCropDetails'),
      description: t('farmer.dashboard.addCropDescription'),
      icon: 'add-circle',
      color: '#2E7D32',
      screen: 'AddCrop',
    },
    {
      title: t('farmer.dashboard.bankDetails'),
      description: t('farmer.dashboard.bankDetailsDescription'),
      icon: 'account-balance',
      color: '#1565C0',
      screen: 'BankDetails',
    },
    {
      title: 'Earnings & Payments',
      description: 'Track receivables, settlements, and legal agreements',
      icon: 'account-balance-wallet',
      color: '#00897B',
      screen: 'Payments',
    },
    {
      title: t('farmer.dashboard.kycVerification'),
      description: t('farmer.dashboard.kycVerificationDescription'),
      icon: 'description',
      color: '#E65100',
      screen: 'KYC',
    },
    {
      title: t('farmer.dashboard.community'),
      description: t('farmer.dashboard.communityDescription'),
      icon: 'people',
      color: '#6A1B9A',
      screen: 'Community',
    },
    {
      title: t('farmer.dashboard.farmCalendar'),
      description: t('farmer.dashboard.farmCalendarDescription'),
      icon: 'calendar-today',
      color: '#1565C0',
      screen: 'Calendar',
    },
  ];

  const openDialer = () => {
    Linking.openURL('tel:865568655');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>{t('farmer.dashboard.welcome')}</Text>
          <Text style={styles.nameText}>{user?.name || 'Farmer'}</Text>
          <Text style={styles.roleText}>🌾 Farmer</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerIcon}>
            <MaterialIcons name="notifications-none" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.headerIcon}>
            <MaterialIcons name="power-settings-new" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={() => navigation.navigate(stat.screen)}
          >
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <MaterialIcons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>
              {loading ? '...' : stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pending Proposals Alert */}
      {stats.pendingProposals > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => navigation.navigate('ReceivedProposals')}
        >
          <MaterialIcons name="assignment" size={20} color="#E65100" style={{ marginRight: 8 }} />
          <Text style={styles.alertText}>
            You have {stats.pendingProposals} new proposal{stats.pendingProposals !== 1 ? 's' : ''} to review
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#E65100" />
        </TouchableOpacity>
      )}

      {/* Pending Orders Alert */}
      {stats.pendingOrders > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => navigation.navigate('MyOrders')}
        >
          <MaterialIcons name="warning" size={20} color="#E65100" style={{ marginRight: 8 }} />
          <Text style={styles.alertText}>
            {t('farmer.dashboard.pendingOrdersAlert', { count: stats.pendingOrders })}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#E65100" />
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddCrop')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#2E7D32' + '20' }]}>
              <MaterialIcons name="add" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.quickActionText}>Add Crop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyCrops')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#1565C0' + '20' }]}>
              <MaterialIcons name="grass" size={22} color="#1565C0" />
            </View>
            <Text style={styles.quickActionText}>My Crops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('ReceivedProposals')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E65100' + '20' }]}>
              <MaterialIcons name="assignment" size={22} color="#E65100" />
              {stats.pendingProposals > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.pendingProposals}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionText}>Proposals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyOrders')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#6A1B9A' + '20' }]}>
              <MaterialIcons name="receipt-long" size={22} color="#6A1B9A" />
            </View>
            <Text style={styles.quickActionText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        {t('farmer.dashboard.description')}
      </Text>

      {/* Feature Cards Grid */}
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
          </TouchableOpacity>
        ))}

        {/* Support Card */}
        <TouchableOpacity
          style={[styles.featureCard, { borderColor: '#D32F2F30' }]}
          onPress={() => setShowSupportModal(true)}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#D32F2F15' }]}>
            <MaterialIcons name="info" size={28} color="#D32F2F" />
          </View>
          <Text style={styles.featureTitle}>{t('farmer.dashboard.farmInfoSupport')}</Text>
          <Text style={styles.featureDescription}>
            {t('farmer.dashboard.farmInfoSupportDescription')}
          </Text>
          <View style={styles.contactInfo}>
            <MaterialIcons name="phone" size={16} color="#2E7D32" style={{ marginRight: 4 }} />
            <Text style={styles.contactText}>865568655</Text>
          </View>
          <TouchableOpacity style={styles.tutorialButton} onPress={() => setShowSupportModal(true)}>
            <MaterialIcons name="play-circle-filled" size={16} color="#FFFFFF" />
            <Text style={styles.tutorialText}>{t('farmer.dashboard.watchTutorial')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Support Modal */}
      <Modal
        visible={showSupportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('farmer.dashboard.howToUsePlatform')}</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoText}>Video Player Placeholder</Text>
              <Text style={styles.videoSubtext}>YouTube video would play here</Text>
            </View>
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>{t('farmer.dashboard.contactUs')}</Text>
              <TouchableOpacity style={styles.phoneRow} onPress={openDialer}>
                <MaterialIcons name="phone" size={16} color="#2E7D32" />
                <Text style={styles.phoneText}>
                  {t('farmer.dashboard.phone')}: 865568655
                </Text>
              </TouchableOpacity>
              <Text style={styles.supportHours}>
                {t('farmer.dashboard.supportHours')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSupportModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeCard: {
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  statCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: '2%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    color: '#E65100',
    fontSize: 14,
    flex: 1,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
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
    position: 'relative',
  },
  quickActionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 14,
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
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  tutorialText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  videoPlaceholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  videoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  videoSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  contactSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 4,
  },
  supportHours: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FarmerDashboardScreen;
