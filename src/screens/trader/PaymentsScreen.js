import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';

const PaymentsScreen = () => {
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('trader.dashboard.payments')}</Text>
        <Text style={styles.description}>{t('trader.dashboard.paymentsDescription')}</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Payments Management</Text>
          <Text style={styles.placeholderSubtext}>Manage your payments and transactions</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default PaymentsScreen;