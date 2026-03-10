import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const TransportBooking = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Book Transport</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pickup Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pickup point"
            value={pickup}
            onChangeText={setPickup}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            value={destination}
            onChangeText={setDestination}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Estimated Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Request Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, backgroundColor: Colors.surface },
  title: { fontSize: 24, fontWeight: 'bold' },
  form: { padding: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default TransportBooking;
