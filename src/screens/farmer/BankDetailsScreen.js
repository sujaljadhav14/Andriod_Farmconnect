import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const maskAccountNumber = (value) => {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.length <= 4) return stringValue;
  return `${'*'.repeat(Math.max(0, stringValue.length - 4))}${stringValue.slice(-4)}`;
};

const BankDetailsScreen = () => {
  const isFocused = useIsFocused();
  const { user, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const loadBankDetails = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const response = await authService.getProfile();
      const profileUser = response?.user || user || {};
      const bankDetails = profileUser.bankDetails || {};

      setAccountHolderName(bankDetails.accountHolderName || profileUser.name || '');
      setAccountNumber(bankDetails.accountNumber || '');
      setIfscCode(bankDetails.ifscCode || '');
    } catch (error) {
      console.error('Bank profile load error:', error);
      Alert.alert('Bank Details', error.message || 'Failed to load bank details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      loadBankDetails();
    }
  }, [isFocused, loadBankDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBankDetails(false);
  }, [loadBankDetails]);

  const validateForm = () => {
    const normalizedAccountNumber = accountNumber.replace(/\s+/g, '');
    const normalizedIfsc = ifscCode.trim().toUpperCase();

    if (!accountHolderName.trim()) {
      Alert.alert('Validation', 'Please enter account holder name.');
      return false;
    }

    if (!normalizedAccountNumber || normalizedAccountNumber.length < 8) {
      Alert.alert('Validation', 'Please enter a valid account number.');
      return false;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      Alert.alert('Validation', 'Please enter a valid IFSC code.');
      return false;
    }

    return true;
  };

  const saveBankDetails = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await authService.updateBankDetails({
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.replace(/\s+/g, ''),
        ifscCode: ifscCode.trim().toUpperCase(),
      });

      await refreshUserProfile();
      Alert.alert('Bank Details', 'Bank details updated successfully.');
    } catch (error) {
      console.error('Save bank details error:', error);
      Alert.alert('Bank Details', error.message || 'Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.infoCard}>
        <MaterialIcons name="account-balance" size={22} color={Colors.primary} />
        <View style={styles.infoTextWrap}>
          <Text style={styles.infoTitle}>Payout Account</Text>
          <Text style={styles.infoDescription}>
            Earnings from completed deals are mapped to this account for settlement records.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Input
          label="Account Holder Name"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          placeholder="As per bank records"
          icon="person"
        />

        <Input
          label="Account Number"
          value={accountNumber}
          onChangeText={(value) => setAccountNumber(value.replace(/[^0-9]/g, ''))}
          placeholder="Enter account number"
          keyboardType="numeric"
          icon="credit-card"
        />

        <Input
          label="IFSC Code"
          value={ifscCode}
          onChangeText={(value) => setIfscCode(value.toUpperCase())}
          placeholder="e.g. SBIN0000123"
          autoCapitalize="characters"
          icon="badge"
        />

        <Button
          title="Save Bank Details"
          icon="save"
          loading={saving}
          onPress={saveBankDetails}
          fullWidth
        />
      </View>

      {!!accountNumber && (
        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Current Account Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Holder</Text>
            <Text style={styles.summaryValue}>{accountHolderName || '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account</Text>
            <Text style={styles.summaryValue}>{maskAccountNumber(accountNumber)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>IFSC</Text>
            <Text style={styles.summaryValue}>{ifscCode || '-'}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoDescription: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
});

export default BankDetailsScreen;