import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';

  const TransportDashboard = ({ navigation }) => {
  const { t } = useLanguage();
  const { logout } = useAuth(); 
  const handleLogout = async () => {
  await logout();
};
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    totalVehicles: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Simulated data fetching
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Simulated data
        setStats({
          activeDeliveries: 3,
          completedDeliveries: 47,
          totalVehicles: 2,
          totalEarnings: 85000,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const featureCards = [
    {
      title: t('transporter.dashboard.availableOrders'),
      description: t('transporter.dashboard.availableOrdersDescription'),
      icon: 'local-shipping',
      color: '#1565C0',
      screen: 'AvailableOrders',
    },
    {
      title: t('transporter.dashboard.activeDeliveries'),
      description: t('transporter.dashboard.activeDeliveriesDescription'),
      icon: 'delivery-dining',
      color: '#2E7D32',
      screen: 'MyDeliveries',
    },
    {
      title: t('transporter.dashboard.kycVerification'),
      description: t('transporter.dashboard.kycVerificationDescription'),
      icon: 'description',
      color: '#1565C0',
      screen: 'KYC',
    },
    {
      title: t('transporter.dashboard.deliveryHistory'),
      description: t('transporter.dashboard.deliveryHistoryDescription'),
      icon: 'history',
      color: '#E65100',
      screen: 'DeliveryHistory',
    },
    {
      title: t('transporter.dashboard.routePlanning'),
      description: t('transporter.dashboard.routePlanningDescription'),
      icon: 'map',
      color: '#1565C0',
      screen: 'RoutePlanning',
    },
    {
      title: t('transporter.dashboard.earningsPayments'),
      description: t('transporter.dashboard.earningsPaymentsDescription'),
      icon: 'account-balance-wallet',
      color: '#2E7D32',
      screen: 'Earnings',
    },
    {
      title: t('transporter.dashboard.scheduleManagement'),
      description: t('transporter.dashboard.scheduleManagementDescription'),
      icon: 'calendar-today',
      color: '#757575',
      screen: 'Schedule',
    },
    {
      title: t('transporter.dashboard.vehicleManagement'),
      description: t('transporter.dashboard.vehicleManagementDescription'),
      icon: 'directions-car',
      color: '#E65100',
      screen: 'Vehicles',
    },
    {
      title: t('transporter.dashboard.supportHelp'),
      description: t('transporter.dashboard.supportHelpDescription'),
      icon: 'help',
      color: '#1565C0',
      screen: 'Support',
    },
  ];

  const openDialer = () => {
    Linking.openURL('tel:865568655');
  };

  const openFeature = (screen) => {
    if (screen === 'Support') {
      setShowSupportModal(true);
      return;
    }

    navigation.navigate(screen);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeTitle}>{t('transporter.dashboard.title')}</Text>
          <Text style={styles.welcomeDescription}>
            {t('transporter.dashboard.description')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
  <MaterialIcons name="notifications-none" size={28} color={Colors.white} />
  
  {/* 🔥 LOGOUT BUTTON */}
  <TouchableOpacity onPress={handleLogout}>
    <MaterialIcons name="power-settings-new" size={28} color={Colors.white} />
  </TouchableOpacity>
</View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#1565C015' }]}>
            <MaterialIcons name="local-shipping" size={24} color="#1565C0" />
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : stats.activeDeliveries}
          </Text>
          <Text style={styles.statLabel}>Active Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#2E7D3215' }]}>
            <MaterialIcons name="check-circle" size={24} color="#2E7D32" />
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : stats.completedDeliveries}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E6510015' }]}>
            <MaterialIcons name="directions-car" size={24} color="#E65100" />
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : stats.totalVehicles}
          </Text>
          <Text style={styles.statLabel}>Vehicles</Text>
        </View>
        {false && (
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6A1B9A15' }]}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#6A1B9A" />
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : `₹${(stats.totalEarnings / 1000).toFixed(1)}K`}
          </Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        )}
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#6A1B9A15' }]}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#6A1B9A" />
          </View>
          <Text style={styles.statValue}>
            {loading ? '...' : `\u20B9${(stats.totalEarnings / 1000).toFixed(1)}K`}
          </Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        {t('transporter.dashboard.description')}
      </Text>

      {/* Feature Cards Grid */}
      <View style={styles.featuresGrid}>
        {featureCards.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, { borderColor: feature.color + '30' }]}
            onPress={() => openFeature(feature.screen)}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
              <MaterialIcons name={feature.icon} size={28} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={() => openFeature(feature.screen)}
            >
              <Text style={styles.actionButtonText}>
                {feature.title === t('transporter.dashboard.availableOrders')
                  ? t('transporter.dashboard.viewOrders')
                  : feature.title === t('transporter.dashboard.activeDeliveries')
                  ? t('transporter.dashboard.trackDeliveries')
                  : feature.title === t('transporter.dashboard.kycVerification')
                  ? t('transporter.dashboard.verifyKYC')
                  : feature.title === t('transporter.dashboard.deliveryHistory')
                  ? t('transporter.dashboard.viewHistory')
                  : feature.title === t('transporter.dashboard.routePlanning')
                  ? t('transporter.dashboard.planRoutes')
                  : feature.title === t('transporter.dashboard.earningsPayments')
                  ? t('transporter.dashboard.viewEarnings')
                  : feature.title === t('transporter.dashboard.scheduleManagement')
                  ? t('transporter.dashboard.manageSchedule')
                  : feature.title === t('transporter.dashboard.vehicleManagement')
                  ? t('transporter.dashboard.manageVehicles')
                  : t('transporter.dashboard.getHelp')}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
              <Text style={styles.modalTitle}>{t('transporter.dashboard.getHelp')}</Text>
              <TouchableOpacity onPress={() => setShowSupportModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>{t('transporter.dashboard.contactUs')}</Text>
              <TouchableOpacity style={styles.phoneRow} onPress={openDialer}>
                <MaterialIcons name="phone" size={16} color="#2E7D32" />
                <Text style={styles.phoneText}>
                  {t('transporter.dashboard.phone')}: 865568655
                </Text>
              </TouchableOpacity>
              <Text style={styles.supportHours}>
                {t('transporter.dashboard.supportHours')}
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
  welcomeSection: {
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  welcomeDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
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
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransportDashboard;
