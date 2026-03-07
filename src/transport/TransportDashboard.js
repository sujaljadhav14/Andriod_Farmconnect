import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const TransportDashboard = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transport Dashboard</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialIcons name="local-shipping" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Active Trips</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="check-circle" size={24} color="#2E7D32" />
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="add-location" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>New Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="track-changes" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Track Fleet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, backgroundColor: Colors.surface },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  statsRow: { flexDirection: 'row', padding: 10, justifyContent: 'space-around' },
  statCard: { backgroundColor: Colors.surface, padding: 15, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginVertical: 5 },
  statLabel: { color: Colors.textSecondary, fontSize: 12 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  actionGrid: { flexDirection: 'row', gap: 15 },
  actionButton: { backgroundColor: Colors.surface, padding: 20, borderRadius: 10, alignItems: 'center', flex: 1, elevation: 2 },
  actionText: { marginTop: 8, fontSize: 14, fontWeight: '500' }
});

export default TransportDashboard;
