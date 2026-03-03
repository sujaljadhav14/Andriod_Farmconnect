import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockVehicles = [
  { id: '1', type: 'Truck', number: 'MH 12 AB 1234', capacity: '5000 kg', year: '2020', status: 'Active' },
  { id: '2', type: 'Mini Truck', number: 'MH 14 CD 5678', capacity: '2000 kg', year: '2022', status: 'Active' },
];

const getVehicleIcon = (type) => {
  switch (type) {
    case 'Truck': return 'local-shipping';
    case 'Mini Truck': return 'airport-shuttle';
    case 'Tempo': return 'directions-bus';
    default: return 'directions-car';
  }
};

const VehicleManagementScreen = () => {
  const handleAddVehicle = () => {
    Alert.alert('Add Vehicle (Demo)', 'Vehicle registration form would appear here.\nThis is a demo.');
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={getVehicleIcon(item.type)} size={28} color="#1565C0" />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleType}>{item.type}</Text>
          <Text style={styles.vehicleNumber}>{item.number}</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.detail}>
          <MaterialIcons name="fitness-center" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Capacity: {item.capacity}</Text>
        </View>
        <View style={styles.detail}>
          <MaterialIcons name="calendar-today" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Year: {item.year}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddVehicle}>
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: '#1565C0',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});

export default VehicleManagementScreen;
