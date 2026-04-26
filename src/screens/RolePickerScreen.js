import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/common';

const RolePickerScreen = ({ navigation }) => {
  const { t } = useLanguage();

  const roles = [
    {
      id: 'farmer',
      title: t('auth.farmer'),
      subtitle: t('rolePicker.roles.farmer'),
      icon: 'agriculture',
      color: '#2E7D32',
      nav: 'FarmerMain',
    },
    {
      id: 'trader',
      title: t('auth.trader'),
      subtitle: t('rolePicker.roles.trader'),
      icon: 'storefront',
      color: '#E65100',
      nav: 'TraderMain',
    },
    {
      id: 'transport',
      title: t('auth.transporter'),
      subtitle: t('rolePicker.roles.transport'),
      icon: 'local-shipping',
      color: '#1565C0',
      nav: 'TransportMain',
    },
    {
      id: 'admin',
      title: t('auth.admin'),
      subtitle: t('rolePicker.roles.admin'),
      icon: 'admin-panel-settings',
      color: '#512DA8',
      nav: 'AdminMain',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.languageSwitcherWrap}>
            <LanguageSwitcher compact />
          </View>
          <MaterialIcons name="eco" size={48} color={Colors.white} />
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('rolePicker.title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('rolePicker.subtitle')}</Text>

          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleCard, { borderLeftColor: role.color }]}
              onPress={() => navigation.navigate(role.nav)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
                <MaterialIcons name={role.icon} size={32} color={Colors.white} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('rolePicker.footer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  languageSwitcherWrap: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default RolePickerScreen;
