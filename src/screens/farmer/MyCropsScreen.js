import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import cropService from '../../services/cropService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadCrops = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await cropService.getMyCrops();
      const normalizedCrops = cropService.normalizeCrops(response.crops || response.data || []);
      setCrops(normalizedCrops);
    } catch (err) {
      console.error('Failed to load crops:', err);
      setError(err.message || 'Failed to load crops');
      setCrops([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadCrops();
    }
  }, [isFocused, loadCrops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCrops(false);
  }, [loadCrops]);

  const handleDeleteCrop = (cropId, cropName) => {
    Alert.alert(
      'Delete Crop',
      `Are you sure you want to delete "${cropName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cropService.deleteCrop(cropId);
              setCrops(crops.filter(c => c.id !== cropId));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete crop');
            }
          },
        },
      ]
    );
  };

  const renderCrop = ({ item }) => (
    <TouchableOpacity
      style={styles.cropCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CropDetail', { cropId: item.id, crop: item })}
    >
      <View style={styles.cropHeader}>
        <View style={styles.cropIconContainer}>
          <MaterialIcons name={getCategoryIcon(item.category)} size={24} color={Colors.primary} />
        </View>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{item.cropName}</Text>
          <Text style={styles.cropCategory}>{item.category}</Text>
        </View>
        <StatusBadge status={item.status} size="small" />
      </View>

      <View style={styles.cropDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="inventory" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.quantity} {item.unit}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="payments" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{formatCurrency(item.pricePerUnit)}/{item.unit}</Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Grade {item.quality}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddCrop', { editCrop: item })}
        >
          <MaterialIcons name="edit" size={18} color={Colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteCrop(item.id, item.cropName)}
        >
          <MaterialIcons name="delete" size={18} color={Colors.error} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner text="Loading crops..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={crops}
        renderItem={renderCrop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          crops.length > 0 ? (
            <View style={styles.summary}>
              <Text style={styles.summaryText}>{crops.length} crop{crops.length !== 1 ? 's' : ''} listed</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="inventory-2" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {error ? 'Failed to load crops' : 'No crops yet'}
            </Text>
            <Text style={styles.emptyText}>
              {error || 'Tap the + button to add your first crop listing'}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadCrops()}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCrop')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
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
    paddingBottom: 100,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cropDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginBottom: 12,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  deleteText: {
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
