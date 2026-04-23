import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import uploadService from '../../services/uploadService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';

const DOCUMENT_TYPES = [
  { label: 'Aadhaar', value: 'aadhaar' },
  { label: 'PAN', value: 'pan' },
  { label: 'Passport', value: 'passport' },
  { label: 'Voter ID', value: 'voter_id' },
  { label: 'Driving License', value: 'driving_license' },
  { label: 'Other', value: 'other' },
];

const STATUS_META = {
  pending: {
    label: 'Not Submitted',
    icon: 'pending-actions',
    bg: '#FFF8E1',
    border: '#FFE082',
    text: '#E65100',
  },
  submitted: {
    label: 'Under Review',
    icon: 'hourglass-top',
    bg: '#E3F2FD',
    border: '#90CAF9',
    text: '#1565C0',
  },
  approved: {
    label: 'Verified',
    icon: 'verified',
    bg: '#E8F5E9',
    border: '#A5D6A7',
    text: '#2E7D32',
  },
  rejected: {
    label: 'Rejected',
    icon: 'cancel',
    bg: '#FFEBEE',
    border: '#FFCDD2',
    text: '#C62828',
  },
};

const normalizeStatus = (status) => {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'verified') return 'approved';
  return value;
};

const buildImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

const KYCManagementScreen = () => {
  const isFocused = useIsFocused();
  const { user, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');
  const [kycDetails, setKycDetails] = useState({});
  const [idProofImage, setIdProofImage] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    documentType: 'aadhaar',
    documentNumber: '',
    address: '',
    businessName: '',
    businessAddress: '',
    gstNumber: '',
    notes: '',
  });

  const isTrader = user?.role === 'trader';

  const setFormField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const hydrateForm = useCallback((details = {}) => {
    setForm((prev) => ({
      ...prev,
      fullName: details.fullName || user?.name || prev.fullName,
      documentType: details.documentType || prev.documentType || 'aadhaar',
      documentNumber: details.documentNumber || '',
      address: details.address || '',
      businessName: details.businessName || '',
      businessAddress: details.businessAddress || '',
      gstNumber: details.gstNumber || '',
      notes: details.notes || '',
    }));

    if (details.idProofImage) {
      setIdProofImage({
        uri: buildImageUrl(details.idProofImage),
        existing: true,
      });
    }
  }, [user?.name]);

  const loadKyc = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const response = await authService.getMyKYC();
      const payload = response?.data || response || {};
      const nextStatus = normalizeStatus(payload.kycStatus);
      const details = payload.kycDetails || {};

      setKycStatus(nextStatus);
      setKycDetails(details);
      hydrateForm(details);
    } catch (error) {
      console.error('KYC load error:', error);
      if (showLoader) {
        Alert.alert('KYC', error.message || 'Failed to load KYC details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hydrateForm]);

  useEffect(() => {
    if (isFocused) {
      loadKyc();
    }
  }, [isFocused, loadKyc]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadKyc(false);
  }, [loadKyc]);

  const currentStatusMeta = useMemo(() => {
    return STATUS_META[kycStatus] || STATUS_META.pending;
  }, [kycStatus]);

  const validateForm = () => {
    if (!form.fullName.trim()) {
      Alert.alert('Validation', 'Please enter your full name.');
      return false;
    }

    if (!form.documentNumber.trim()) {
      Alert.alert('Validation', 'Please enter your document number.');
      return false;
    }

    if (form.documentNumber.trim().length < 6) {
      Alert.alert('Validation', 'Document number looks too short.');
      return false;
    }

    return true;
  };

  const pickDocumentFromGallery = async () => {
    try {
      const image = await uploadService.pickImageFromGallery({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });
      if (image) {
        setIdProofImage(image);
      }
    } catch (error) {
      Alert.alert('Upload', error.message || 'Failed to select image');
    }
  };

  const pickDocumentFromCamera = async () => {
    try {
      const image = await uploadService.pickImageFromCamera({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
      });
      if (image) {
        setIdProofImage(image);
      }
    } catch (error) {
      Alert.alert('Upload', error.message || 'Failed to capture image');
    }
  };

  const submitKyc = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName.trim());
      formData.append('documentType', form.documentType);
      formData.append('documentNumber', form.documentNumber.trim());
      formData.append('address', form.address.trim());
      formData.append('businessName', form.businessName.trim());
      formData.append('businessAddress', form.businessAddress.trim());
      formData.append('gstNumber', form.gstNumber.trim().toUpperCase());
      formData.append('notes', form.notes.trim());

      if (idProofImage && !idProofImage.existing) {
        formData.append('idProofImage', {
          uri: idProofImage.uri,
          type: idProofImage.type || 'image/jpeg',
          name: idProofImage.name || `kyc_${Date.now()}.jpg`,
        });
      }

      await authService.submitKYC(formData);
      await refreshUserProfile();
      await loadKyc(false);

      Alert.alert('KYC', 'KYC submitted successfully. We will review it shortly.');
    } catch (error) {
      console.error('KYC submit error:', error);
      Alert.alert('KYC', error.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading KYC details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.statusCard, { backgroundColor: currentStatusMeta.bg, borderColor: currentStatusMeta.border }]}> 
        <MaterialIcons name={currentStatusMeta.icon} size={24} color={currentStatusMeta.text} />
        <View style={styles.statusTextWrap}>
          <Text style={[styles.statusLabel, { color: currentStatusMeta.text }]}>{currentStatusMeta.label}</Text>
          <Text style={styles.statusHint}>
            {kycStatus === 'approved'
              ? 'Your verification is complete.'
              : kycStatus === 'submitted'
                ? 'Your verification details are being reviewed.'
                : kycStatus === 'rejected'
                  ? (kycDetails?.rejectionReason || 'Please update details and submit again.')
                  : 'Submit your KYC details to unlock full platform actions.'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity Details</Text>

        <Input
          label="Full Name"
          value={form.fullName}
          onChangeText={(value) => setFormField('fullName', value)}
          placeholder="Enter full name"
          icon="person"
        />

        <Text style={styles.inputLabel}>Document Type</Text>
        <View style={styles.chipsWrap}>
          {DOCUMENT_TYPES.map((document) => {
            const selected = form.documentType === document.value;
            return (
              <TouchableOpacity
                key={document.value}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => setFormField('documentType', document.value)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{document.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Document Number"
          value={form.documentNumber}
          onChangeText={(value) => setFormField('documentNumber', value)}
          placeholder="Enter document number"
          autoCapitalize="characters"
          icon="badge"
        />

        <Input
          label="Address"
          value={form.address}
          onChangeText={(value) => setFormField('address', value)}
          placeholder="Address as per document"
          icon="location-on"
          multiline
          numberOfLines={3}
        />

        {isTrader && (
          <>
            <Input
              label="Business Name"
              value={form.businessName}
              onChangeText={(value) => setFormField('businessName', value)}
              placeholder="Enter business name"
              icon="store"
            />

            <Input
              label="Business Address"
              value={form.businessAddress}
              onChangeText={(value) => setFormField('businessAddress', value)}
              placeholder="Enter business address"
              icon="apartment"
              multiline
              numberOfLines={3}
            />

            <Input
              label="GST Number (Optional)"
              value={form.gstNumber}
              onChangeText={(value) => setFormField('gstNumber', value)}
              placeholder="Enter GST number"
              autoCapitalize="characters"
              icon="receipt"
            />
          </>
        )}

        <Input
          label="Additional Notes (Optional)"
          value={form.notes}
          onChangeText={(value) => setFormField('notes', value)}
          placeholder="Any additional verification context"
          icon="notes"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload ID Proof</Text>

        {idProofImage?.uri ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: idProofImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setIdProofImage(null)}>
              <MaterialIcons name="close" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyImageBox}>
            <MaterialIcons name="image" size={24} color={Colors.textSecondary} />
            <Text style={styles.emptyImageText}>No document image selected</Text>
          </View>
        )}

        <View style={styles.uploadButtonsRow}>
          <Button
            title="Gallery"
            variant="outline"
            icon="photo-library"
            onPress={pickDocumentFromGallery}
            style={styles.halfButton}
          />
          <Button
            title="Camera"
            variant="outline"
            icon="photo-camera"
            onPress={pickDocumentFromCamera}
            style={styles.halfButton}
          />
        </View>

        <Text style={styles.imageHelpText}>
          Upload a clear photo of your selected identity document.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current Submission</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Submitted On</Text>
          <Text style={styles.summaryValue}>
            {kycDetails?.submittedAt ? formatDate(kycDetails.submittedAt, 'datetime') : 'Not submitted'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Reviewed On</Text>
          <Text style={styles.summaryValue}>
            {kycDetails?.reviewedAt ? formatDate(kycDetails.reviewedAt, 'datetime') : 'Pending'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Role</Text>
          <Text style={styles.summaryValue}>{isTrader ? 'Trader' : 'Farmer'}</Text>
        </View>
      </View>

      <Button
        title={kycStatus === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}
        icon="verified-user"
        onPress={submitKyc}
        loading={submitting}
        fullWidth
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusHint: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
  },
  imagePreviewWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 170,
    backgroundColor: '#F0F0F0',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImageBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 26,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyImageText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  imageHelpText: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    marginLeft: 10,
    textAlign: 'right',
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
});

export default KYCManagementScreen;
