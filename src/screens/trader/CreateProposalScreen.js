/**
 * Create Proposal Screen - Trader
 * Allows traders to submit proposals for crops
 * NO DEMO DATA - All data from real backend
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import proposalService from '../../services/proposalService';
import { Button, LoadingSpinner } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import { PAYMENT_TERMS } from '../../config/constants';

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

const CreateProposalScreen = ({ route, navigation }) => {
  const { crop } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposedQuantity: '',
    proposedPrice: crop?.pricePerUnit?.toString() || '',
    message: '',
    paymentTerms: 'On Delivery',
    deliveryAddress: '',
  });
  const [errors, setErrors] = useState({});

  if (!crop) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>Crop not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    const quantity = parseFloat(formData.proposedQuantity);
    if (!formData.proposedQuantity || isNaN(quantity) || quantity <= 0) {
      newErrors.proposedQuantity = 'Please enter a valid quantity';
    } else if (quantity > (crop.availableQuantity || crop.quantity)) {
      newErrors.proposedQuantity = `Maximum available: ${crop.availableQuantity || crop.quantity} ${crop.unit}`;
    }

    const price = parseFloat(formData.proposedPrice);
    if (!formData.proposedPrice || isNaN(price) || price <= 0) {
      newErrors.proposedPrice = 'Please enter a valid price';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Please enter delivery address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const proposalData = {
        proposedQuantity: parseFloat(formData.proposedQuantity),
        proposedPrice: parseFloat(formData.proposedPrice),
        message: formData.message.trim(),
        paymentTerms: formData.paymentTerms,
        deliveryAddress: formData.deliveryAddress.trim(),
      };

      await proposalService.createProposal(crop.id, proposalData);

      Alert.alert(
        'Proposal Submitted',
        `Your proposal for ${crop.cropName} has been sent to the farmer successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(formData.proposedQuantity || 0) * parseFloat(formData.proposedPrice || 0);
  const maxQuantity = crop.availableQuantity || crop.quantity;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Crop Info Card */}
        <View style={styles.cropCard}>
          <View style={styles.cropImageContainer}>
            {crop.cropImage ? (
              <Image source={{ uri: crop.cropImage }} style={styles.cropImage} />
            ) : (
              <View style={styles.cropImagePlaceholder}>
                <MaterialIcons name={getCategoryIcon(crop.category)} size={32} color={Colors.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{crop.cropName}</Text>
            {crop.variety && <Text style={styles.cropVariety}>{crop.variety}</Text>}
            <View style={styles.cropMeta}>
              <Text style={styles.cropPrice}>
                {formatCurrency(crop.pricePerUnit)}/{crop.unit}
              </Text>
              <Text style={styles.cropAvailable}>
                {maxQuantity} {crop.unit} available
              </Text>
            </View>
          </View>
        </View>

        {/* Proposal Form */}
        <Text style={styles.sectionTitle}>Your Proposal</Text>

        {/* Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Proposed Quantity ({crop.unit}) *</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="inventory" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={formData.proposedQuantity}
              onChangeText={(text) => {
                setFormData({ ...formData, proposedQuantity: text.replace(/[^0-9.]/g, '') });
                setErrors({ ...errors, proposedQuantity: null });
              }}
              placeholder={`Enter quantity (max ${maxQuantity})`}
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
          {errors.proposedQuantity && (
            <Text style={styles.errorText}>{errors.proposedQuantity}</Text>
          )}
          <TouchableOpacity onPress={() => setFormData({ ...formData, proposedQuantity: maxQuantity.toString() })}>
            <Text style={styles.maxButton}>Use max quantity</Text>
          </TouchableOpacity>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Proposed Price (₹/{crop.unit}) *</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="payments" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.input}
              value={formData.proposedPrice}
              onChangeText={(text) => {
                setFormData({ ...formData, proposedPrice: text.replace(/[^0-9.]/g, '') });
                setErrors({ ...errors, proposedPrice: null });
              }}
              placeholder="Enter price per unit"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
          </View>
          {errors.proposedPrice && (
            <Text style={styles.errorText}>{errors.proposedPrice}</Text>
          )}
          <Text style={styles.helperText}>
            Farmer's asking price: {formatCurrency(crop.pricePerUnit)}/{crop.unit}
          </Text>
        </View>

        {/* Total Amount Display */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount || 0)}</Text>
        </View>

        {/* Payment Terms */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Terms *</Text>
          <View style={styles.paymentTermsContainer}>
            {PAYMENT_TERMS.map((term) => (
              <TouchableOpacity
                key={term}
                style={[
                  styles.termOption,
                  formData.paymentTerms === term && styles.termOptionActive,
                ]}
                onPress={() => setFormData({ ...formData, paymentTerms: term })}
              >
                <Text
                  style={[
                    styles.termOptionText,
                    formData.paymentTerms === term && styles.termOptionTextActive,
                  ]}
                >
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery Address *</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.deliveryAddress}
              onChangeText={(text) => {
                setFormData({ ...formData, deliveryAddress: text });
                setErrors({ ...errors, deliveryAddress: null });
              }}
              placeholder="Enter complete delivery address"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
          {errors.deliveryAddress && (
            <Text style={styles.errorText}>{errors.deliveryAddress}</Text>
          )}
        </View>

        {/* Message to Farmer */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message to Farmer (Optional)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Add any special requirements or notes..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{formData.message.length}/500</Text>
        </View>

        {/* Submit Button */}
        <Button
          title="Submit Proposal"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.submitButton}
          disabled={loading}
        />

        <Text style={styles.disclaimer}>
          By submitting this proposal, you agree to negotiate in good faith with the farmer.
          The farmer may accept, reject, or counter your proposal.
        </Text>
      </ScrollView>

      <LoadingSpinner visible={loading} overlay text="Submitting proposal..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cropCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cropImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 14,
  },
  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropInfo: {
    flex: 1,
    justifyContent: 'center',
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
  cropMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  cropPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E65100',
  },
  cropAvailable: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  textAreaContainer: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 10,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
    marginLeft: 0,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  maxButton: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  paymentTermsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  termOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  termOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termOptionText: {
    fontSize: 13,
    color: Colors.text,
  },
  termOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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

export default CreateProposalScreen;
