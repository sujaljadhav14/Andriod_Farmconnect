/**
 * Browse Crops Screen - Trader View
 * Shows all available crops from farmers with search and filter functionality
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import cropService from '../../services/cropService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import { CROP_CATEGORIES, QUALITY_GRADES } from '../../config/constants';

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

const BrowseCropsScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    quality: '',
    minPrice: '',
    maxPrice: '',
  });

  const loadCrops = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      // Build filter object for API
      const apiFilters = {
        search: search.trim() || undefined,
        category: filters.category || undefined,
        quality: filters.quality || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
      };

      const response = await cropService.getAvailableCrops(apiFilters);
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
  }, [search, filters]);

  useEffect(() => {
    if (isFocused) {
      loadCrops();
    }
  }, [isFocused, loadCrops]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCrops(false);
  }, [loadCrops]);

  const handleSearch = () => {
    loadCrops();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      quality: '',
      minPrice: '',
      maxPrice: '',
    });
    setSearch('');
  };

  const applyFilters = () => {
    setShowFilters(false);
    loadCrops();
  };

  const hasActiveFilters = filters.category || filters.quality || filters.minPrice || filters.maxPrice;

  const renderCrop = ({ item }) => (
    <TouchableOpacity
      style={styles.cropCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CropDetail', { cropId: item.id, crop: item })}
    >
      {/* Crop Image */}
      <View style={styles.imageContainer}>
        {item.cropImage ? (
          <Image source={{ uri: item.cropImage }} style={styles.cropImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name={getCategoryIcon(item.category)} size={32} color={Colors.textSecondary} />
          </View>
        )}
        <StatusBadge status={item.status} size="small" style={styles.statusBadge} />
      </View>

      {/* Crop Info */}
      <View style={styles.cropContent}>
        <View style={styles.cropHeader}>
          <View style={styles.cropTitleContainer}>
            <Text style={styles.cropName} numberOfLines={1}>{item.cropName}</Text>
            {item.variety && (
              <Text style={styles.cropVariety} numberOfLines={1}>({item.variety})</Text>
            )}
          </View>
          <Text style={styles.cropPrice}>{formatCurrency(item.pricePerUnit)}/{item.unit}</Text>
        </View>

        {/* Farmer Info */}
        {item.farmer && (
          <View style={styles.farmerInfo}>
            <MaterialIcons name="person" size={14} color={Colors.textSecondary} />
            <Text style={styles.farmerName} numberOfLines={1}>
              {item.farmer.name || 'Farmer'}
            </Text>
          </View>
        )}

        {/* Location */}
        {(item.location || item.locationDetails?.district) && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.locationDetails?.district || item.location}
              {item.locationDetails?.state && `, ${item.locationDetails.state}`}
            </Text>
          </View>
        )}

        {/* Footer Details */}
        <View style={styles.cropFooter}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Grade {item.quality}</Text>
          </View>
          <Text style={styles.qty}>{item.availableQuantity || item.quantity} {item.unit}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Crops</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, !filters.category && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, category: '' })}
            >
              <Text style={[styles.filterChipText, !filters.category && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {CROP_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.filterChip, filters.category === cat.value && styles.filterChipActive]}
                onPress={() => setFilters({ ...filters, category: cat.value })}
              >
                <Text style={[styles.filterChipText, filters.category === cat.value && styles.filterChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quality Filter */}
          <Text style={styles.filterLabel}>Quality Grade</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, !filters.quality && styles.filterChipActive]}
              onPress={() => setFilters({ ...filters, quality: '' })}
            >
              <Text style={[styles.filterChipText, !filters.quality && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {QUALITY_GRADES.map((grade) => (
              <TouchableOpacity
                key={grade.value}
                style={[styles.filterChip, filters.quality === grade.value && styles.filterChipActive]}
                onPress={() => setFilters({ ...filters, quality: grade.value })}
              >
                <Text style={[styles.filterChipText, filters.quality === grade.value && styles.filterChipTextActive]}>
                  {grade.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <Text style={styles.filterLabel}>Price Range (₹/unit)</Text>
          <View style={styles.priceInputs}>
            <TextInput
              style={styles.priceInput}
              value={filters.minPrice}
              onChangeText={(text) => setFilters({ ...filters, minPrice: text.replace(/[^0-9]/g, '') })}
              placeholder="Min"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.priceSeparator}>to</Text>
            <TextInput
              style={styles.priceInput}
              value={filters.maxPrice}
              onChangeText={(text) => setFilters({ ...filters, maxPrice: text.replace(/[^0-9]/g, '') })}
              placeholder="Max"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <LoadingSpinner text="Loading crops..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Search crops, farmers, locations..."
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); loadCrops(); }}>
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="filter-list" size={24} color={hasActiveFilters ? Colors.white : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Filters:</Text>
          {filters.category && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>{filters.category}</Text>
              <TouchableOpacity onPress={() => { setFilters({ ...filters, category: '' }); loadCrops(); }}>
                <MaterialIcons name="close" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {filters.quality && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>Grade {filters.quality}</Text>
              <TouchableOpacity onPress={() => { setFilters({ ...filters, quality: '' }); loadCrops(); }}>
                <MaterialIcons name="close" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterText}>
                ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '∞'}
              </Text>
              <TouchableOpacity onPress={() => { setFilters({ ...filters, minPrice: '', maxPrice: '' }); loadCrops(); }}>
                <MaterialIcons name="close" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Crops List */}
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
              <Text style={styles.summaryText}>
                {crops.length} crop{crops.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {error ? 'Failed to load crops' : 'No crops found'}
            </Text>
            <Text style={styles.emptyText}>
              {error || (hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'No crops are currently available. Check back later!')}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadCrops()}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  activeFiltersLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: Colors.primary,
    marginRight: 4,
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.border,
    position: 'relative',
  },
  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cropContent: {
    padding: 16,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cropTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cropName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  cropVariety: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cropPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  cropFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  qty: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  priceSeparator: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BrowseCropsScreen;
