/**
 * Loading Spinner Component
 * Reusable loading indicator with overlay option
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal } from 'react-native';
import Colors from '../../constants/colors';

const LoadingSpinner = ({
  visible = true,
  size = 'large',
  color = Colors.primary,
  text,
  overlay = false,
}) => {
  if (!visible) return null;

  const spinner = (
    <View style={overlay ? styles.overlayContainer : styles.container}>
      <View style={overlay ? styles.spinnerBox : null}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        {spinner}
      </Modal>
    );
  }

  return spinner;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spinnerBox: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
