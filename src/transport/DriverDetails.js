import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const DriverDetails = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color={Colors.textSecondary} />
        </View>
        <Text style={styles.name}>Rahul Kumar</Text>
        <Text style={styles.rating}>⭐ 4.8 (120+ trips)</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MaterialIcons name="drive-eta" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>Tata Ace (MH-15-AB-1234)</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={24} color={Colors.primary} />
          <View style={styles.infoText}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>+91 98765 43210</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="verified-user" size={24} color="#2E7D32" />
          <View style={styles.infoText}>
            <Text style={styles.label}>Verification Status</Text>
            <Text style={styles.value}>Verified Professional</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.callButton}>
        <MaterialIcons name="call" size={24} color="white" />
        <Text style={styles.callButtonText}>Call Driver</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, backgroundColor: Colors.surface },
  title: { fontSize: 24, fontWeight: 'bold' },
  profileCard: {
    backgroundColor: Colors.surface,
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  name: { fontSize: 22, fontWeight: 'bold' },
  rating: { fontSize: 16, color: Colors.textSecondary, marginTop: 5 },
  infoSection: { padding: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  infoText: { marginLeft: 15 },
  label: { fontSize: 12, color: Colors.textSecondary },
  value: { fontSize: 16, fontWeight: '500' },
  callButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 12,
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0
  },
  callButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }
});

export default DriverDetails;
