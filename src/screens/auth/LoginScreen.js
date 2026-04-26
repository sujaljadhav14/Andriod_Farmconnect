/**
 * Login Screen
 * Phone + Password login with OTP option
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
import { useAuth } from '../../context/AuthContext';
import { Button, Input, LoadingSpinner, LanguageSwitcher } from '../../components/common';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';
import { validatePhone, validatePassword } from '../../utils/validation';

const LoginScreen = ({ navigation }) => {
  const { login, sendOTP, loading } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) newErrors.phone = phoneResult.error;

    const passwordResult = validatePassword(password);
    if (!passwordResult.isValid) newErrors.password = passwordResult.error;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
  if (!validateForm()) return;

  const result = await login(phone, password);

  if (!result.success) {
    setErrors({ general: result.error || t('auth.loginFailed') });
  }
};

  const handleOTPLogin = async () => {
    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) {
      setErrors({ phone: phoneResult.error });
      return;
    }

    const result = await sendOTP(phone);

    if (result.success) {
      navigation.navigate('OTPVerification', { phone });
    } else {
      setErrors({ general: result.error || t('auth.otpFailed') });
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
          <LanguageSwitcher style={styles.languageSwitcher} />

          {/* Logo/Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>FC</Text>
            </View>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginTitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label={t('auth.phoneNumber')}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''));
                setErrors({ ...errors, phone: null, general: null });
              }}
              placeholder={t('auth.enterPhone')}
              keyboardType="phone-pad"
              maxLength={10}
              icon="phone"
              error={errors.phone}
            />

            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: null, general: null });
              }}
              placeholder={t('auth.enterPassword')}
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <Button
              title={t('common.login')}
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title={t('auth.otpLogin')}
              onPress={handleOTPLogin}
              variant="outline"
              fullWidth
              icon="sms"
              loading={loading}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>{t('common.register')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingSpinner visible={loading} overlay text={t('auth.loggingIn')} />
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
  languageSwitcher: {
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    textAlign: 'center',
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
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
    fontSize: 14,
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

export default LoginScreen;
