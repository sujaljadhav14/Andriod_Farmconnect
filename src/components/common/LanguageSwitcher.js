import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = ({ compact = false, style }) => {
  const { language, changeLanguage, availableLanguages, t } = useLanguage();

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View style={styles.header}>
        <MaterialIcons name="language" size={18} color={compact ? Colors.white : Colors.primary} />
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {t('common.language')}
        </Text>
      </View>

      <View style={styles.options}>
        {availableLanguages.map((item) => {
          const isActive = item.code === language;

          return (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.option,
                compact && styles.optionCompact,
                isActive && styles.optionActive,
                isActive && compact && styles.optionActiveCompact,
              ]}
              onPress={() => changeLanguage(item.code)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.optionText,
                  compact && styles.optionTextCompact,
                  isActive && styles.optionTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerCompact: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  titleCompact: {
    color: Colors.white,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  optionCompact: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  optionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionActiveCompact: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTextCompact: {
    color: Colors.white,
  },
  optionTextActive: {
    color: Colors.white,
  },
});

export default LanguageSwitcher;
