import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please enter a phone number and password.',
      });
      return;
    }

    const result = await login({ phone: phone.trim(), password: password.trim() });

    if (!result.success) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: result.message,
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Logged in',
      text2: 'Welcome back!',
    });

    navigation.navigate('RolePicker');
  };

  const handleOtpLogin = () => {
    Toast.show({
      type: 'info',
      text1: 'OTP Login',
      text2: 'This is a demo flow. You can implement OTP logic here.',
    });
    navigation.navigate('RolePicker');
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} active="login" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>
          <Text style={styles.cardSubtitle}>Login to Your Account</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+919876543210"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleOtpLogin}
          >
            <Text style={styles.secondaryButtonText}>Login with OTP</Text>
          </TouchableOpacity>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  navButtonActive: {
    backgroundColor: Colors.primary,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  navTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F4F8FF',
    color: Colors.text,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginScreen;
