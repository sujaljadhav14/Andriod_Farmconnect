import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockCrops = [
  { id: '1', name: 'Wheat', category: 'Grains', quantity: '500 kg', price: '\u20B928/kg', quality: 'A+', status: 'Available', harvestDate: '2025-03-15' },
  { id: '2', name: 'Rice (Basmati)', category: 'Grains', quantity: '1000 kg', price: '\u20B965/kg', quality: 'A', status: 'Reserved', harvestDate: '2025-02-20' },
  { id: '3', name: 'Tomatoes', category: 'Vegetables', quantity: '200 kg', price: '\u20B940/kg', quality: 'A', status: 'Available', harvestDate: '2025-01-30' },
  { id: '4', name: 'Onions', category: 'Vegetables', quantity: '800 kg', price: '\u20B922/kg', quality: 'B', status: 'Available', harvestDate: '2025-02-10' },
  { id: '5', name: 'Turmeric', category: 'Spices', quantity: '150 kg', price: '\u20B9120/kg', quality: 'A+', status: 'Sold', harvestDate: '2025-01-15' },
  { id: '6', name: 'Soybean', category: 'Pulses', quantity: '600 kg', price: '\u20B955/kg', quality: 'A', status: 'Available', harvestDate: '2025-03-01' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Available': return '#2E7D32';
    case 'Reserved': return '#E65100';
    case 'Sold': return '#1565C0';
    default: return Colors.textSecondary;
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Grains': return 'grass';
    case 'Vegetables': return 'eco';
    case 'Fruits': return 'local-florist';
    case 'Spices': return 'local-fire-department';
    case 'Pulses': return 'grain';
    default: return 'agriculture';
  }
};

const MyCropsScreen = ({ navigation }) => {
  const renderCrop = ({ item }) => (
    <TouchableOpacity style={styles.cropCard} activeOpacity={0.7}>
      <View style={styles.cropHeader}>
        <View style={styles.cropIconContainer}>
          <MaterialIcons name={getCategoryIcon(item.category)} size={24} color={Colors.primary} />
        </View>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{item.name}</Text>
          <Text style={styles.cropCategory}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.cropDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="inventory" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.quantity}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="payments" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.price}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Grade {item.quality}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockCrops}
        renderItem={renderCrop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryText}>{mockCrops.length} crops listed</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCropFromList')}
        activeOpacity={0.8}>
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
  },
  summary: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cropCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cropCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default MyCropsScreen;
