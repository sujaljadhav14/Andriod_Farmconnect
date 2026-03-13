import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const roleOptions = [
  { label: 'Farmer', value: 'farmer' },
  { label: 'Trader', value: 'trader' },
  { label: 'Transporter', value: 'transport' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Marathi', value: 'mr' },
];

const Header = ({ navigation, active }) => (
  <View style={styles.headerContainer}>
    <View style={styles.brandRow}>
      <MaterialIcons name="eco" size={26} color={Colors.primary} />
      <Text style={styles.brandTitle}>Sudeshm Agro</Text>
    </View>
    <View style={styles.navRow}>
      <TouchableOpacity
        style={styles.navButton}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('RolePicker')}
      >
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, active === 'register' && styles.navButtonActive]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={[styles.navText, active === 'register' && styles.navTextActive]}>
          Register
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, active === 'login' && styles.navButtonActive]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={[styles.navText, active === 'login' && styles.navTextActive]}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const Dropdown = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (item) => {
    onSelect(item.value);
    setOpen(false);
  };

  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.dropdownText}>{selected?.label}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const RegisterScreen = ({ navigation }) => {
  const { language: currentLanguage, changeLanguage } = useLanguage();
  const [language, setLanguage] = useState(currentLanguage);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('farmer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const { register } = useAuth();

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please fill all required fields.',
      });
      return;
    }

    changeLanguage(language);

    const userData = await register({
      fullName: fullName.trim(),
      role,
      phone: phone.trim(),
      password: password.trim(),
      language,
    });

    Toast.show({
      type: 'success',
      text1: 'Registered',
      text2: `Welcome, ${userData.fullName}!`,
    });

    const target =
      role === 'farmer'
        ? 'FarmerMain'
        : role === 'trader'
        ? 'TraderMain'
        : 'TransportMain';

    navigation.navigate(target);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader navigation={navigation} active="register" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New Account</Text>

          <Dropdown
            label="Language"
            value={language}
            options={languageOptions}
            onSelect={setLanguage}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              style={styles.input}
            />
          </View>

          <Dropdown label="Role" value={role} options={roleOptions} onSelect={setRole} />

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

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleRegister}
          >
            <Text style={styles.primaryButtonText}>Register</Text>
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
    marginBottom: 20,
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
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F4F8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: Colors.text,
    fontSize: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.border,
  },
});

export default RegisterScreen;
