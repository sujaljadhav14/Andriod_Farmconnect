import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';

const TraderDashboardScreen = ({ navigation }) => {
  const { t } = useLanguage();

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
      icon: 'show_chart',
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

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>{t('trader.dashboard.title')}</Text>
        <Text style={styles.welcomeDescription}>
          {t('trader.dashboard.description')}
        </Text>
      </View>

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
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <Text style={styles.actionButtonText}>
                {feature.title === t('trader.dashboard.kycVerification') 
                  ? t('trader.dashboard.verifyKYC')
                  : feature.title === t('trader.dashboard.browseCrops')
                  ? t('trader.dashboard.browseNow')
                  : feature.title === t('trader.dashboard.myProposals')
                  ? t('trader.dashboard.viewProposals')
                  : feature.title === t('trader.dashboard.myOrders')
                  ? t('trader.dashboard.trackOrders')
                  : feature.title === t('trader.dashboard.payments')
                  ? t('trader.dashboard.managePayments')
                  : feature.title === t('trader.dashboard.marketAnalytics')
                  ? t('trader.dashboard.viewAnalytics')
                  : t('trader.dashboard.connectNow')}
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
    backgroundColor: Colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
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
});

export default TraderDashboardScreen;