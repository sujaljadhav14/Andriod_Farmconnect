import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Marathi', value: 'mr' },
];

const AppHeader = ({ navigation, active }) => {
  const { language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);

  const selectedLang = languageOptions.find((l) => l.value === language) || languageOptions[0];

  const navItems = [
    { label: 'Home', key: user ? 'RolePicker' : 'Auth', color: Colors.success },
    { label: 'Register', key: 'Register', color: Colors.secondary },
    { label: 'Login', key: 'Login', color: Colors.error },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <MaterialIcons name="eco" size={26} color={Colors.primary} />
        <Text style={styles.brandTitle}>Sudeshm Agro</Text>
      </View>

      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.langButton}
          activeOpacity={0.7}
          onPress={() => setLangOpen(true)}
        >
          <MaterialIcons name="language" size={18} color={Colors.textSecondary} />
          <Text style={styles.langText}>{selectedLang.label}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.navRow}>
          {navItems.map((item) => {
            const isActive = active === item.key.toLowerCase();
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navButton,
                  { borderColor: item.color },
                  isActive && { backgroundColor: item.color },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.key)}
              >
                <Text
                  style={[
                    styles.navText,
                    isActive && { color: Colors.white },
                    !isActive && { color: item.color },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal visible={langOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    changeLanguage(item.value);
                    setLangOpen(false);
                  }}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 12,
    backgroundColor: Colors.surface,
  },
  langText: {
    marginHorizontal: 6,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  navText: {
    fontSize: 13,
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
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalItem: {
    paddingVertical: 12,
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

export default AppHeader;
