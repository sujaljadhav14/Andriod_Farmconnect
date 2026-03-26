/**
 * Status Badge Component
 * Displays status with color-coded badges
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const StatusBadge = ({ status, size = 'medium', style }) => {
  const getStatusConfig = (statusText) => {
    const normalizedStatus = statusText?.toLowerCase() || '';

    // Order/Delivery Status
    if (normalizedStatus.includes('pending')) {
      return { color: '#F59E0B', background: '#FEF3C7', label: status };
    }
    if (normalizedStatus.includes('accepted') || normalizedStatus.includes('approved')) {
      return { color: '#10B981', background: '#D1FAE5', label: status };
    }
    if (normalizedStatus.includes('rejected') || normalizedStatus.includes('failed')) {
      return { color: '#EF4444', background: '#FEE2E2', label: status };
    }
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('delivered')) {
      return { color: '#059669', background: '#A7F3D0', label: status };
    }
    if (normalizedStatus.includes('transit') || normalizedStatus.includes('progress')) {
      return { color: '#3B82F6', background: '#DBEAFE', label: status };
    }
    if (normalizedStatus.includes('cancelled')) {
      return { color: '#6B7280', background: '#E5E7EB', label: status };
    }
    if (normalizedStatus.includes('available')) {
      return { color: '#10B981', background: '#D1FAE5', label: status };
    }
    if (normalizedStatus.includes('reserved')) {
      return { color: '#8B5CF6', background: '#EDE9FE', label: status };
    }
    if (normalizedStatus.includes('sold')) {
      return { color: '#6B7280', background: '#E5E7EB', label: status };
    }
    if (normalizedStatus.includes('assigned')) {
      return { color: '#3B82F6', background: '#DBEAFE', label: status };
    }
    if (normalizedStatus.includes('picked')) {
      return { color: '#8B5CF6', background: '#EDE9FE', label: status };
    }

    // Default
    return { color: '#6B7280', background: '#F3F4F6', label: status };
  };

  const config = getStatusConfig(status);

  return (
    <View
      style={[
        styles.badge,
        styles[`badge_${size}`],
        { backgroundColor: config.background },
        style,
      ]}
    >
      <Text style={[styles.text, styles[`text_${size}`], { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  badge_small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badge_medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badge_large: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  text_small: {
    fontSize: 10,
  },
  text_medium: {
    fontSize: 12,
  },
  text_large: {
    fontSize: 14,
  },
});

export default StatusBadge;
