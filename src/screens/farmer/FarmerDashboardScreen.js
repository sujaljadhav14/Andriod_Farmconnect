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
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';

const FarmerDashboardScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalCrops: 0,
    activeCrops: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Simulated data fetching (replace with actual API calls)
  useEffect(() => {
    // Simulate API call
    const fetchDashboardStats = async () => {
      try {
        // In real app, make API calls here
        // const cropsRes = await axios.get('/api/crops/my-crops');
        // const ordersRes = await axios.get('/api/orders/farmer/my-orders');
        
        // Simulated data
        setStats({
          totalCrops: 8,
          activeCrops: 5,
          pendingOrders: 3,
          completedOrders: 24,
          totalEarnings: 120000,
          pendingPayments: 45000,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    { 
      title: t('farmer.dashboard.totalCrops'), 
      value: stats.totalCrops, 
      icon: 'grass', 
      color: '#2E7D32' 
    },
    { 
      title: t('farmer.dashboard.activeListings'), 
      value: stats.activeCrops, 
      icon: 'trending-up', 
      color: '#1565C0' 
    },
    { 
      title: t('farmer.dashboard.pendingOrders'), 
      value: stats.pendingOrders, 
      icon: 'hourglass-empty', 
      color: '#E65100' 
    },
    { 
      title: t('farmer.dashboard.totalEarnings'), 
      value: `₹${(stats.totalEarnings / 1000).toFixed(1)}L`, 
      icon: 'account-balance-wallet', 
      color: '#6A1B9A' 
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
      icon: 'cloud-sun',
      color: '#1565C0',
      screen: 'Weather',
    },
    {
      title: t('farmer.dashboard.marketPrices'),
      description: t('farmer.dashboard.marketPricesDescription'),
      icon: 'chart-line',
      color: '#6A1B9A',
      screen: 'MarketPrices',
    },
    {
      title: t('farmer.dashboard.addCropDetails'),
      description: t('farmer.dashboard.addCropDescription'),
      icon: 'plus-circle',
      color: '#2E7D32',
      screen: 'AddCrop',
    },
    {
      title: t('farmer.dashboard.bankDetails'),
      description: t('farmer.dashboard.bankDetailsDescription'),
      icon: 'university',
      color: '#1565C0',
      screen: 'BankDetails',
    },
    {
      title: t('farmer.dashboard.kycVerification'),
      description: t('farmer.dashboard.kycVerificationDescription'),
      icon: 'file-alt',
      color: '#E65100',
      screen: 'KYC',
    },
    {
      title: t('farmer.dashboard.community'),
      description: t('farmer.dashboard.communityDescription'),
      icon: 'users',
      color: '#6A1B9A',
      screen: 'Community',
    },
    {
      title: t('farmer.dashboard.farmCalendar'),
      description: t('farmer.dashboard.farmCalendarDescription'),
      icon: 'calendar-alt',
      color: '#1565C0',
      screen: 'Calendar',
    },
  ];

  const openDialer = () => {
    Linking.openURL('tel:865568655');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Card */}
      <View style={styles.welcomeCard}>
        <View>
          <Text style={styles.welcomeText}>{t('farmer.dashboard.welcome')}</Text>
          <Text style={styles.nameText}>Farmer Demo User</Text>
        </View>
        <MaterialIcons name="notifications-none" size={28} color={Colors.white} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <MaterialIcons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>
              {loading ? '...' : stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Pending Orders Alert */}
      {stats.pendingOrders > 0 && (
        <View style={styles.alertCard}>
          <MaterialIcons name="warning" size={20} color="#E65100" style={{ marginRight: 8 }} />
          <Text style={styles.alertText}>
            {t('farmer.dashboard.pendingOrdersAlert', { count: stats.pendingOrders })}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyOrders')}>
            <Text style={styles.alertLink}>{t('farmer.dashboard.viewOrdersLink')}</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <MaterialIcons name="play-circle-filled" size={16} color={Colors.white} />
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
  welcomeText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
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
  alertCard: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  alertText: {
    color: '#E65100',
    fontSize: 14,
    flex: 1,
  },
  alertLink: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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
    color: Colors.white,
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
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FarmerDashboardScreen;