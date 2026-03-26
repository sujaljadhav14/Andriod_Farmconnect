/**
 * Custom Button Component
 * Reusable button with consistent styling
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, text, danger
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const buttonStyles = [
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonDisabled,
    fullWidth && styles.buttonFullWidth,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? Colors.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <MaterialIcons
              name={icon}
              size={size === 'small' ? 18 : size === 'large' ? 24 : 20}
              color={variant === 'outline' || variant === 'text' ? Colors.primary : '#FFFFFF'}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <MaterialIcons
              name={icon}
              size={size === 'small' ? 18 : size === 'large' ? 24 : 20}
              color={variant === 'outline' || variant === 'text' ? Colors.primary : '#FFFFFF'}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonDanger: {
    backgroundColor: Colors.error,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonFullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: Colors.primary,
  },
  textText: {
    color: Colors.primary,
  },
  textDanger: {
    color: '#FFFFFF',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textDisabled: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;
