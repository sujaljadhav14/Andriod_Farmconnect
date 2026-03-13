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
import { useAuth } from '../context/AuthContext';

const roles = [
  {
    id: 'farmer',
    title: 'Farmer',
    subtitle: 'Manage crops, view orders & track earnings',
    icon: 'agriculture',
    color: '#2E7D32',
    nav: 'FarmerMain',
  },
  {
    id: 'trader',
    title: 'Trader',
    subtitle: 'Browse crops, place orders & make proposals',
    icon: 'storefront',
    color: '#E65100',
    nav: 'TraderMain',
  },
  {
    id: 'transport',
    title: 'Transporter',
    subtitle: 'Manage vehicles, accept deliveries & track routes',
    icon: 'local-shipping',
    color: '#1565C0',
    nav: 'TransportMain',
  },
];

const RolePickerScreen = ({ navigation }) => {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandRow}>
              <MaterialIcons name="eco" size={40} color={Colors.white} />
              <Text style={styles.title}>FarmConnect</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={() => {
                logout();
                navigation.replace('Auth');
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Connecting Farmers, Traders & Transporters
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Choose your role to explore</Text>
          <Text style={styles.sectionSubtitle}>
            Pick a role to continue through the app.
          </Text>

          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleCard, { borderLeftColor: role.color }]}
              onPress={() => navigation.navigate(role.nav)}
              activeOpacity={0.7}>
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
          <Text style={styles.footerText}>
            Logged in as {user?.fullName ?? 'Guest'} ({user?.role ?? 'No role'})
          </Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
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

