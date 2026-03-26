import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getCrops, isCropApiConfigured } from '../../services/cropService';

const getStatusColor = (status) => {
  switch (status) {
    case 'Available':
      return '#2E7D32';
    case 'Reserved':
      return '#E65100';
    case 'Sold':
      return '#1565C0';
    default:
      return Colors.textSecondary;
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Grains':
      return 'grass';
    case 'Vegetables':
      return 'eco';
    case 'Fruits':
      return 'local-florist';
    case 'Spices':
      return 'local-fire-department';
    case 'Pulses':
      return 'grain';
    default:
      return 'agriculture';
  }
};

const MyCropsScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataMode, setDataMode] = useState('demo');

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    const loadCrops = async () => {
      setLoading(true);

      try {
        const result = await getCrops();
        setCrops(result.crops);
        setDataMode(result.mode);
      } catch (error) {
        console.error('Failed to load crops:', error);
        setCrops([]);
        setDataMode('demo');
      } finally {
        setLoading(false);
      }
    };

    loadCrops();
  }, [isFocused]);

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
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading crops...</Text>
        </View>
      ) : (
        <FlatList
          data={crops}
          renderItem={renderCrop}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <View style={styles.summary}>
                <Text style={styles.summaryText}>{crops.length} crops listed</Text>
              </View>
              <View style={styles.modeBanner}>
                <MaterialIcons
                  name={dataMode === 'remote' ? 'cloud-done' : 'science'}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.modeBannerText}>
                  {dataMode === 'remote'
                    ? 'Showing crop data from the backend service.'
                    : isCropApiConfigured()
                    ? 'Crop API was unreachable, so demo data is shown.'
                    : 'Crop API is not configured, so demo data is shown.'}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory-2" size={40} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No crops available</Text>
              <Text style={styles.emptyText}>Add a crop to start building your listing.</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCrop')}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  summary: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modeBannerText: {
    flex: 1,
    marginLeft: 8,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 6,
    color: Colors.textSecondary,
    textAlign: 'center',
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
