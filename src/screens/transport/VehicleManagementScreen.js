import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import vehicleService from '../../services/vehicleService';
import { LoadingSpinner } from '../../components/common';

const getVehicleIcon = (type) => {
  switch (type) {
    case 'Truck': return 'local-shipping';
    case 'Mini Truck': return 'airport-shuttle';
    case 'Tempo': return 'directions-bus';
    default: return 'directions-car';
  }
};

const VehicleManagementScreen = () => {
  const isFocused = useIsFocused();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vehicleType: '',
    vehicleNumber: '',
    capacity: '',
    capacityUnit: 'kg',
    model: '',
    year: '',
  });

  const loadVehicles = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await vehicleService.getMyVehicles();
      const normalized = vehicleService.normalizeVehicles(response.data || response.vehicles || []);
      setVehicles(normalized);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
      setError(err.message || 'Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadVehicles();
    }
  }, [isFocused, loadVehicles]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehicles(false);
  }, [loadVehicles]);

  const resetForm = () => {
    setForm({
      vehicleType: '',
      vehicleNumber: '',
      capacity: '',
      capacityUnit: 'kg',
      model: '',
      year: '',
    });
  };

  const handleAddVehicle = async () => {
    if (!form.vehicleType.trim() || !form.vehicleNumber.trim() || !form.capacity.trim()) {
      Alert.alert('Validation', 'Vehicle type, number, and capacity are required.');
      return;
    }

    const parsedCapacity = Number(form.capacity);
    if (!parsedCapacity || parsedCapacity <= 0) {
      Alert.alert('Validation', 'Please enter a valid vehicle capacity.');
      return;
    }

    try {
      setSubmitting(true);
      await vehicleService.addVehicle({
        vehicleType: form.vehicleType.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        capacity: parsedCapacity,
        capacityUnit: form.capacityUnit,
        model: form.model.trim(),
        year: form.year ? Number(form.year) : undefined,
      });

      setShowAddModal(false);
      resetForm();
      loadVehicles(false);
      Alert.alert('Success', 'Vehicle added successfully');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (vehicle) => {
    const nextStatus = vehicle.availabilityStatus === 'available' ? 'maintenance' : 'available';

    try {
      await vehicleService.updateAvailability(vehicle.id, nextStatus);
      loadVehicles(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update vehicle status');
    }
  };

  const handleRemoveVehicle = (vehicle) => {
    Alert.alert(
      'Remove Vehicle',
      `Remove ${vehicle.vehicleNumber} from your active fleet?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleService.deleteVehicle(vehicle.id);
              loadVehicles(false);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove vehicle');
            }
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={getVehicleIcon(item.vehicleType)} size={28} color="#1565C0" />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleType}>{item.vehicleType}</Text>
          <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: vehicleService.getAvailabilityColor(item.availabilityStatus) + '20' }]}>
          <Text style={[styles.activeText, { color: vehicleService.getAvailabilityColor(item.availabilityStatus) }]}>
            {vehicleService.getAvailabilityLabel(item.availabilityStatus)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.detail}>
          <MaterialIcons name="fitness-center" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Capacity: {item.capacity} {item.capacityUnit}</Text>
        </View>
        <View style={styles.detail}>
          <MaterialIcons name="calendar-today" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Year: {item.year || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.availabilityBtn]}
          onPress={() => handleToggleAvailability(item)}
        >
          <MaterialIcons name="sync" size={14} color="#1565C0" />
          <Text style={styles.availabilityBtnText}>
            {item.availabilityStatus === 'available' ? 'Set Maintenance' : 'Set Available'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleRemoveVehicle(item)}
        >
          <MaterialIcons name="delete-outline" size={14} color="#D32F2F" />
          <Text style={styles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading vehicles..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="directions-car" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>{error ? 'Unable to load vehicles' : 'No vehicles added yet'}</Text>
            <Text style={styles.emptyText}>
              {error || 'Add your first vehicle to start accepting transport deliveries.'}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadVehicles()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Vehicle</Text>

            <TextInput
              style={styles.input}
              placeholder="Vehicle Type (e.g., Truck)"
              value={form.vehicleType}
              onChangeText={(text) => setForm((prev) => ({ ...prev, vehicleType: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Number"
              value={form.vehicleNumber}
              onChangeText={(text) => setForm((prev) => ({ ...prev, vehicleNumber: text }))}
              autoCapitalize="characters"
            />
            <TextInput
              style={styles.input}
              placeholder="Capacity"
              value={form.capacity}
              onChangeText={(text) => setForm((prev) => ({ ...prev, capacity: text }))}
              keyboardType="numeric"
            />

            <View style={styles.unitRow}>
              {['kg', 'ton'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitBtn, form.capacityUnit === unit && styles.unitBtnActive]}
                  onPress={() => setForm((prev) => ({ ...prev, capacityUnit: unit }))}
                >
                  <Text style={[styles.unitBtnText, form.capacityUnit === unit && styles.unitBtnTextActive]}>
                    {unit.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Model (optional)"
              value={form.model}
              onChangeText={(text) => setForm((prev) => ({ ...prev, model: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Year (optional)"
              value={form.year}
              onChangeText={(text) => setForm((prev) => ({ ...prev, year: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveModalBtn, submitting && styles.saveModalBtnDisabled]}
                onPress={handleAddVehicle}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Vehicle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1565C0' + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  vehicleInfo: { flex: 1 },
  vehicleType: { fontSize: 16, fontWeight: '600', color: Colors.text },
  vehicleNumber: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  activeBadge: { backgroundColor: '#2E7D32' + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeText: { fontSize: 12, fontWeight: '600', color: '#2E7D32' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12,
  },
  detail: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  availabilityBtn: { backgroundColor: '#1565C015' },
  availabilityBtnText: { marginLeft: 4, color: '#1565C0', fontWeight: '600', fontSize: 12 },
  deleteBtn: { backgroundColor: '#D32F2F15' },
  deleteBtnText: { marginLeft: 4, color: '#D32F2F', fontWeight: '600', fontSize: 12 },
  fab: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1565C0',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  emptyState: { alignItems: 'center', marginTop: 90, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { marginTop: 8, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  unitRow: { flexDirection: 'row', marginBottom: 10, gap: 10 },
  unitBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  unitBtnActive: { borderColor: '#1565C0', backgroundColor: '#1565C015' },
  unitBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  unitBtnTextActive: { color: '#1565C0' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: Colors.border },
  cancelModalBtnText: { color: Colors.text, fontWeight: '600' },
  saveModalBtn: { backgroundColor: '#1565C0' },
  saveModalBtnDisabled: { opacity: 0.7 },
  saveModalBtnText: { color: Colors.white, fontWeight: '700' },
});

export default VehicleManagementScreen;
