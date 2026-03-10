import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const TrackingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Tracking</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <MaterialIcons name="map" size={64} color={Colors.textSecondary} />
        <Text style={styles.mapText}>Map Integration Coming Soon</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.infoRow}>
          <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.label}>Current Status</Text>
            <Text style={styles.value}>In Transit - On Route to Pune</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.label}>Estimated Arrival</Text>
            <Text style={styles.value}>2:45 PM (Today)</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, backgroundColor: Colors.surface },
  title: { fontSize: 24, fontWeight: 'bold' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 15
  },
  mapText: { marginTop: 10, color: Colors.textSecondary, fontWeight: '500' },
  statusCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    margin: 15,
    borderRadius: 15,
    elevation: 4
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 15 },
  label: { fontSize: 12, color: Colors.textSecondary },
  value: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 15 }
});

export default TrackingScreen;
