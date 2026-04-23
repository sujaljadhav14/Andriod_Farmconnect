/**
 * Crop Detail Screen - Trader View
 * Shows complete crop information and allows making proposals
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import cropService from '../../services/cropService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

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

const CropDetailScreen = ({ route, navigation }) => {
  const { cropId, crop: initialCrop } = route.params || {};
  const [crop, setCrop] = useState(initialCrop ? cropService.normalizeCrop(initialCrop) : null);
  const [loading, setLoading] = useState(!initialCrop);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadCropDetails = async (showLoader = true) => {
    if (!cropId && !initialCrop?.id) return;

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await cropService.getCropDetails(cropId || initialCrop?.id);
      const normalizedCrop = cropService.normalizeCrop(response.crop || response.data || response);
      setCrop(normalizedCrop);
    } catch (err) {
      console.error('Failed to load crop details:', err);
      setError(err.message || 'Failed to load crop details');
      // Keep using initial data if available
      if (!crop && initialCrop) {
        setCrop(cropService.normalizeCrop(initialCrop));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Load fresh details from API
    if (cropId || initialCrop?.id) {
      loadCropDetails();
    }
  }, [cropId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCropDetails(false);
  };

  const handleMakeProposal = () => {
    navigation.navigate('CreateProposal', { crop });
  };

  const handleContactFarmer = async () => {
    if (crop?.farmer?.phone) {
      const phoneUrl = `tel:${crop.farmer.phone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        Linking.openURL(phoneUrl);
      }
    }
  };

  const handleWhatsApp = async () => {
    if (crop?.farmer?.phone) {
      const message = `Hello, I'm interested in your ${crop.cropName} listed on FarmConnect.`;
      const whatsappUrl = `whatsapp://send?phone=+91${crop.farmer.phone}&text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        Linking.openURL(whatsappUrl);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading crop details..." />;
  }

  if (error && !crop) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Failed to load crop</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadCropDetails()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!crop) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="inventory-2" size={48} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>Crop not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const locationString = crop.locationDetails
    ? [
      crop.locationDetails.village,
      crop.locationDetails.tehsil,
      crop.locationDetails.district,
      crop.locationDetails.state,
    ]
      .filter(Boolean)
      .join(', ')
    : crop.location;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Crop Image */}
      <View style={styles.imageContainer}>
        {crop.cropImage ? (
          <Image source={{ uri: crop.cropImage }} style={styles.cropImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name={getCategoryIcon(crop.category)} size={64} color={Colors.textSecondary} />
            <Text style={styles.imagePlaceholderText}>{crop.category}</Text>
          </View>
        )}
        <StatusBadge status={crop.status} style={styles.statusBadge} />
      </View>

      <View style={styles.content}>
        {/* Crop Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{crop.cropName}</Text>
          {crop.variety && <Text style={styles.variety}>{crop.variety}</Text>}
        </View>

        {/* Price and Quality */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(crop.pricePerUnit)}/{crop.unit}</Text>
          <View style={styles.qualityBadge}>
            <MaterialIcons name="star" size={14} color="#2E7D32" />
            <Text style={styles.qualityText}>Grade {crop.quality}</Text>
          </View>
        </View>

        {/* Expected Price Indicator */}
        {crop.expectedPricePerUnit && crop.expectedPricePerUnit !== crop.pricePerUnit && (
          <View style={styles.expectedPriceRow}>
            <MaterialIcons name="trending-up" size={16} color={Colors.textSecondary} />
            <Text style={styles.expectedPriceText}>
              Expected: {formatCurrency(crop.expectedPricePerUnit)}/{crop.unit}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="inventory" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{crop.availableQuantity || crop.quantity}</Text>
            <Text style={styles.statLabel}>{crop.unit} Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialIcons name="category" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{crop.category}</Text>
            <Text style={styles.statLabel}>Category</Text>
          </View>
          {crop.reservedQuantity > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="lock" size={20} color={Colors.warning} />
                <Text style={styles.statValue}>{crop.reservedQuantity}</Text>
                <Text style={styles.statLabel}>{crop.unit} Reserved</Text>
              </View>
            </>
          )}
        </View>

        {/* Farmer Information */}
        {crop.farmer && crop.farmer.name && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Farmer Details</Text>
            <View style={styles.farmerInfo}>
              <View style={styles.farmerAvatar}>
                <MaterialIcons name="person" size={28} color={Colors.primary} />
              </View>
              <View style={styles.farmerDetails}>
                <Text style={styles.farmerName}>{crop.farmer.name || 'Farmer'}</Text>
                {crop.farmer.phone && (
                  <Text style={styles.farmerPhone}>+91 {crop.farmer.phone}</Text>
                )}
              </View>
            </View>
            {crop.farmer.phone && (
              <View style={styles.contactButtons}>
                <TouchableOpacity style={styles.contactButton} onPress={handleContactFarmer}>
                  <MaterialIcons name="call" size={18} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.contactButton, styles.whatsappButton]} onPress={handleWhatsApp}>
                  <MaterialIcons name="chat" size={18} color="#25D366" />
                  <Text style={[styles.contactButtonText, { color: '#25D366' }]}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Crop Details Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Crop Details</Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="inventory" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Total Quantity</Text>
            <Text style={styles.detailValue}>{crop.quantity} {crop.unit}</Text>
          </View>
          <View style={styles.divider} />

          {crop.cultivationDate && (
            <>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Cultivation Date</Text>
                <Text style={styles.detailValue}>{formatDate(crop.cultivationDate)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {crop.expectedHarvestDate && (
            <>
              <View style={styles.detailRow}>
                <MaterialIcons name="event-available" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Expected Harvest</Text>
                <Text style={styles.detailValue}>{formatDate(crop.expectedHarvestDate)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {crop.harvestDate && (
            <>
              <View style={styles.detailRow}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.detailLabel}>Harvested On</Text>
                <Text style={styles.detailValue}>{formatDate(crop.harvestDate)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{locationString || 'Not specified'}</Text>
          </View>

          {crop.locationDetails?.pincode && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialIcons name="local-post-office" size={20} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Pincode</Text>
                <Text style={styles.detailValue}>{crop.locationDetails.pincode}</Text>
              </View>
            </>
          )}
        </View>

        {/* Description */}
        {crop.description && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{crop.description}</Text>
          </View>
        )}

        {/* Listing Info */}
        <View style={styles.listingInfo}>
          {crop.createdAt && (
            <Text style={styles.listingText}>Listed on {formatDate(crop.createdAt)}</Text>
          )}
          {crop.updatedAt && crop.updatedAt !== crop.createdAt && (
            <Text style={styles.listingText}>Last updated {formatDate(crop.updatedAt)}</Text>
          )}
        </View>

        {/* Action Buttons */}
        {crop.status === 'available' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.proposalButton} onPress={handleMakeProposal}>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.proposalButtonText}>Make Proposal</Text>
            </TouchableOpacity>
          </View>
        )}

        {crop.status && crop.status !== 'available' && (
          <View style={styles.unavailableNotice}>
            <MaterialIcons name="info-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.unavailableText}>
              This crop is currently {crop.status} and not available for proposals.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageContainer: {
    height: 250,
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
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  content: {
    padding: 20,
  },
  titleContainer: {
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  variety: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E65100',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32' + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  qualityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 4,
  },
  expectedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expectedPriceText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 10,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  farmerPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginRight: 12,
  },
  whatsappButton: {
    borderColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  listingInfo: {
    marginBottom: 16,
  },
  listingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  actionContainer: {
    marginBottom: 20,
  },
  proposalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proposalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  unavailableNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.border,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  unavailableText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
});

export default CropDetailScreen;
