/**
 * Register Screen
 * New user registration with role selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, LoadingSpinner } from '../../components/common';
import Colors from '../../constants/colors';
import { validatePhone, validatePassword, validateName } from '../../utils/validation';
import { USER_ROLES } from '../../config/constants';

const ROLES = [
  { key: USER_ROLES.FARMER, label: 'Farmer', icon: 'agriculture', description: 'Sell your crops directly' },
  { key: USER_ROLES.TRADER, label: 'Trader', icon: 'store', description: 'Buy crops from farmers' },
  { key: USER_ROLES.TRANSPORT, label: 'Transport', icon: 'local-shipping', description: 'Deliver goods' },
];

const RegisterScreen = ({ navigation }) => {
  const { register, sendOTP, loading } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    const nameResult = validateName(name);
    if (!nameResult.isValid) newErrors.name = nameResult.error;

    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) newErrors.phone = phoneResult.error;

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) newErrors.password = passwordResult.error;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!selectedRole) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const result = await register({
      name,
      phone,
      password,
      role: selectedRole,
    });

    if (result.success) {
      // Send OTP after successful registration
      const otpResult = await sendOTP(phone);
      if (otpResult.success) {
        navigation.navigate('OTPVerification', { phone, isNewUser: true });
      } else {
        // Registration successful but OTP failed - still navigate
        navigation.navigate('OTPVerification', { phone, isNewUser: true });
      }
    } else {
      setErrors({ general: result.error || 'Registration failed. Please try again.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join FarmConnect to start trading</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label="Full Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: null, general: null });
              }}
              placeholder="Enter your full name"
              autoCapitalize="words"
              icon="person"
              error={errors.name}
            />

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                setErrors({ ...errors, phone: null, general: null });
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              maxLength={10}
              icon="phone"
              error={errors.phone}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: null, general: null });
              }}
              placeholder="Create a password"
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors({ ...errors, confirmPassword: null, general: null });
              }}
              placeholder="Confirm your password"
              secureTextEntry
              icon="lock"
              error={errors.confirmPassword}
            />

            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Select Your Role</Text>
              {errors.role && <Text style={styles.roleError}>{errors.role}</Text>}

              <View style={styles.roleContainer}>
                {ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleCard,
                      selectedRole === role.key && styles.roleCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedRole(role.key);
                      setErrors({ ...errors, role: null });
                    }}
                  >
                    <MaterialIcons
                      name={role.icon}
                      size={32}
                      color={selectedRole === role.key ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.roleTitle,
                        selectedRole === role.key && styles.roleTitleSelected,
                      ]}
                    >
                      {role.label}
                    </Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingSpinner visible={loading} overlay text="Creating account..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  roleSection: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  roleError: {
    fontSize: 12,
    color: Colors.error,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  roleTitleSelected: {
    color: Colors.primary,
  },
  roleDescription: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
