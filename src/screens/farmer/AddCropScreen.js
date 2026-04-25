import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/colors';
import cropService from '../../services/cropService';
import uploadService from '../../services/uploadService';
import { Button, LoadingSpinner } from '../../components/common';
import { CROP_CATEGORIES, QUALITY_GRADES, CROP_UNITS } from '../../config/constants';
import { API_ENDPOINTS } from '../../config/api';
import { formatDate } from '../../utils/formatters';
import apiService from '../../services/apiService';

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

// Common crop suggestions by category
const CROP_SUGGESTIONS = {
  Grains: ['Wheat', 'Rice', 'Maize', 'Barley', 'Jowar', 'Bajra', 'Ragi'],
  Vegetables: ['Tomato', 'Potato', 'Onion', 'Cauliflower', 'Cabbage', 'Brinjal', 'Okra', 'Spinach'],
  Fruits: ['Mango', 'Banana', 'Apple', 'Grapes', 'Orange', 'Papaya', 'Guava', 'Pomegranate'],
  Pulses: ['Chana', 'Moong', 'Urad', 'Masoor', 'Toor', 'Rajma', 'Lobia'],
  Spices: ['Turmeric', 'Ginger', 'Chili', 'Coriander', 'Cumin', 'Cardamom', 'Black Pepper'],
  Other: ['Cotton', 'Sugarcane', 'Jute', 'Groundnut', 'Soybean', 'Sunflower'],
};

const AddCropScreen = ({ navigation, route }) => {
  const editCrop = route?.params?.editCrop;
  const isEditMode = !!editCrop;

  // Form state
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('');
  const [variety, setVariety] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quality, setQuality] = useState('A');
  const [landUnderCultivation, setLandUnderCultivation] = useState('');
  const [cultivationDate, setCultivationDate] = useState(null);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState(null);
  const [village, setVillage] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [cropImage, setCropImage] = useState(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showCultivationPicker, setShowCultivationPicker] = useState(false);
  const [showHarvestPicker, setShowHarvestPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (editCrop) {
      setCropName(editCrop.cropName || '');
      setCategory(editCrop.category || '');
      setVariety(editCrop.variety || '');
      setDescription(editCrop.description || '');
      setQuantity(String(editCrop.quantity || ''));
      setUnit(editCrop.unit || 'kg');
      setPricePerUnit(String(editCrop.pricePerUnit || ''));
      setQuality(editCrop.quality || 'A');
      setLandUnderCultivation(String(editCrop.landUnderCultivation || ''));
      if (editCrop.cultivationDate) setCultivationDate(new Date(editCrop.cultivationDate));
      if (editCrop.expectedHarvestDate) setExpectedHarvestDate(new Date(editCrop.expectedHarvestDate));
      if (editCrop.locationDetails) {
        setVillage(editCrop.locationDetails.village || '');
        setTehsil(editCrop.locationDetails.tehsil || '');
        setDistrict(editCrop.locationDetails.district || '');
        setState(editCrop.locationDetails.state || '');
        setPincode(editCrop.locationDetails.pincode || '');
      }
      if (editCrop.cropImage) {
        setCropImage({ uri: editCrop.cropImage, existing: true });
      }
    }
  }, [editCrop]);

  const validateForm = () => {
    const newErrors = {};

    if (!cropName.trim()) newErrors.cropName = 'Crop name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!pricePerUnit || parseFloat(pricePerUnit) <= 0) newErrors.pricePerUnit = 'Valid price is required';
    if (!expectedHarvestDate) newErrors.expectedHarvestDate = 'Harvest date is required';
    if (!village.trim()) newErrors.village = 'Village is required';
    if (!tehsil.trim()) newErrors.tehsil = 'Tehsil is required';
    if (!district.trim()) newErrors.district = 'District is required';
    if (!state) newErrors.state = 'State is required';
    if (!pincode || pincode.length !== 6) newErrors.pincode = 'Valid 6-digit pincode is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const image = await uploadService.pickImageFromGallery({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (image) {
        setCropImage(image);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await uploadService.pickImageFromCamera({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (image) {
        setCropImage(image);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to take photo');
    }
  };

  const handleRemoveImage = () => {
    setCropImage(null);
  };

  const testNetworkConnection = async () => {
    console.log('🔍 Testing network connection...');

    // Test basic connectivity
    const healthCheck = await apiService.checkConnection();
    console.log('Health check:', healthCheck);

    // Test crops endpoint
    const cropTest = await apiService.testEndpoint(API_ENDPOINTS.CROPS.AVAILABLE);
    console.log('Crop endpoint test:', cropTest);

    // Test with auth
    const authTest = await apiService.testEndpoint(API_ENDPOINTS.CROPS.ADD, 'POST');
    console.log('Add crop endpoint test:', authTest);

    Alert.alert('Network Test', `Health: ${healthCheck}, Crops: ${cropTest.success}, Auth: ${authTest.success}`);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Details', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    try {
      const locationString = `${village}, ${tehsil}, ${district}, ${state} - ${pincode}`;

      // Map frontend quality grades to backend enum values
      const qualityGradeMap = {
        'A+': 'Premium',
        'A': 'Grade A',
        'B': 'Grade B',
        'C': 'Grade C',
      };

      const cropData = {
        cropName: cropName.trim(),
        category,
        variety: variety.trim(),
        description: description.trim(),
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        expectedPricePerUnit: parseFloat(pricePerUnit),
        quality: qualityGradeMap[quality] || quality, // Map to backend value
        landUnderCultivation: landUnderCultivation ? parseFloat(landUnderCultivation) : undefined,
        cultivationDate: cultivationDate ? cultivationDate.toISOString() : undefined,
        harvestDate: expectedHarvestDate.toISOString(),
        expectedHarvestDate: expectedHarvestDate.toISOString(),
        location: locationString,
        locationDetails: {
          village: village.trim(),
          tehsil: tehsil.trim(),
          district: district.trim(),
          state,
          pincode: pincode.trim(),
        },
      };

      // Only pass image if it's a new image (not existing)
      const imageToUpload = cropImage && !cropImage.existing ? cropImage : null;

      console.log('📝 Adding Crop with data:', {
        cropName: cropData.cropName,
        category: cropData.category,
        quantity: cropData.quantity,
        price: cropData.pricePerUnit,
        qualityGrade: cropData.quality,
        hasImage: !!imageToUpload,
        imageUri: imageToUpload?.uri,
        location: cropData.locationDetails,
      });

      let response;
      if (isEditMode) {
        console.log('📝 Updating crop:', editCrop.id);
        response = await cropService.updateCrop(editCrop.id, cropData, imageToUpload);
      } else {
        console.log('📝 Creating new crop');
        response = await cropService.addCrop(cropData, imageToUpload);
      }

      console.log('✅ Crop saved successfully:', response);

      Alert.alert(
        isEditMode ? 'Crop Updated' : 'Crop Added',
        `${cropName.trim()} has been ${isEditMode ? 'updated' : 'added'} successfully!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('❌ Failed to save crop:', {
        message: error.message,
        stack: error.stack,
        isNetworkError: error.message?.includes('Network'),
      });
      Alert.alert(
        'Error',
        error.message || 'Failed to save crop. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderSectionHeader = (title, icon) => (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={20} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderError = (field) => (
    errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Crop Information Section */}
        {renderSectionHeader('Crop Information', 'agriculture')}

        <Text style={styles.label}>Crop Name *</Text>
        <TextInput
          style={[styles.input, errors.cropName && styles.inputError]}
          value={cropName}
          onChangeText={(text) => { setCropName(text); setErrors({ ...errors, cropName: null }); }}
          placeholder="e.g. Wheat, Rice, Tomatoes"
          placeholderTextColor={Colors.textSecondary}
        />
        {renderError('cropName')}

        {/* Crop Suggestions based on category */}
        {category && CROP_SUGGESTIONS[category] && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Suggestions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CROP_SUGGESTIONS[category].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => setCropName(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipContainer}>
          {CROP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.chip, category === cat.value && styles.chipSelected]}
              onPress={() => { setCategory(cat.value); setErrors({ ...errors, category: null }); }}
            >
              <Text style={[styles.chipText, category === cat.value && styles.chipTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {renderError('category')}

        <Text style={styles.label}>Variety (Optional)</Text>
        <TextInput
          style={styles.input}
          value={variety}
          onChangeText={setVariety}
          placeholder="e.g. Basmati, Hybrid"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={(text) => setDescription(text.slice(0, 500))}
          placeholder="Describe your crop quality, features, etc."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        {/* Quantity & Pricing Section */}
        {renderSectionHeader('Quantity & Pricing', 'payments')}

        <View style={styles.row}>
          <View style={styles.flex2}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={[styles.input, errors.quantity && styles.inputError]}
              value={quantity}
              onChangeText={(text) => { setQuantity(text.replace(/[^0-9.]/g, '')); setErrors({ ...errors, quantity: null }); }}
              placeholder="e.g. 500"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
            {renderError('quantity')}
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.unitContainer}>
              {CROP_UNITS.slice(0, 3).map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.unitChip, unit === u.value && styles.unitChipSelected]}
                  onPress={() => setUnit(u.value)}
                >
                  <Text style={[styles.unitText, unit === u.value && styles.unitTextSelected]}>
                    {u.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Price per {unit} (₹) *</Text>
        <TextInput
          style={[styles.input, errors.pricePerUnit && styles.inputError]}
          value={pricePerUnit}
          onChangeText={(text) => { setPricePerUnit(text.replace(/[^0-9.]/g, '')); setErrors({ ...errors, pricePerUnit: null }); }}
          placeholder="e.g. 28"
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textSecondary}
        />
        {renderError('pricePerUnit')}

        <Text style={styles.label}>Quality Grade</Text>
        <View style={styles.chipContainer}>
          {QUALITY_GRADES.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={[styles.chip, quality === q.value && styles.chipSelected]}
              onPress={() => setQuality(q.value)}
            >
              <Text style={[styles.chipText, quality === q.value && styles.chipTextSelected]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cultivation Details Section */}
        {renderSectionHeader('Cultivation Details', 'calendar-today')}

        <Text style={styles.label}>Land Under Cultivation (acres)</Text>
        <TextInput
          style={styles.input}
          value={landUnderCultivation}
          onChangeText={(text) => setLandUnderCultivation(text.replace(/[^0-9.]/g, ''))}
          placeholder="e.g. 2.5"
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Cultivation Date (Optional)</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowCultivationPicker(true)}
        >
          <MaterialIcons name="event" size={20} color={Colors.textSecondary} />
          <Text style={[styles.dateText, !cultivationDate && styles.placeholderText]}>
            {cultivationDate ? formatDate(cultivationDate) : 'Select cultivation date'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Expected Harvest Date *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.expectedHarvestDate && styles.inputError]}
          onPress={() => setShowHarvestPicker(true)}
        >
          <MaterialIcons name="event" size={20} color={Colors.textSecondary} />
          <Text style={[styles.dateText, !expectedHarvestDate && styles.placeholderText]}>
            {expectedHarvestDate ? formatDate(expectedHarvestDate) : 'Select harvest date'}
          </Text>
        </TouchableOpacity>
        {renderError('expectedHarvestDate')}

        {/* Location Section */}
        {renderSectionHeader('Location Details', 'location-on')}

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Village *</Text>
            <TextInput
              style={[styles.input, errors.village && styles.inputError]}
              value={village}
              onChangeText={(text) => { setVillage(text); setErrors({ ...errors, village: null }); }}
              placeholder="Village name"
              placeholderTextColor={Colors.textSecondary}
            />
            {renderError('village')}
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Tehsil *</Text>
            <TextInput
              style={[styles.input, errors.tehsil && styles.inputError]}
              value={tehsil}
              onChangeText={(text) => { setTehsil(text); setErrors({ ...errors, tehsil: null }); }}
              placeholder="Tehsil name"
              placeholderTextColor={Colors.textSecondary}
            />
            {renderError('tehsil')}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>District *</Text>
            <TextInput
              style={[styles.input, errors.district && styles.inputError]}
              value={district}
              onChangeText={(text) => { setDistrict(text); setErrors({ ...errors, district: null }); }}
              placeholder="District name"
              placeholderTextColor={Colors.textSecondary}
            />
            {renderError('district')}
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              value={pincode}
              onChangeText={(text) => { setPincode(text.replace(/[^0-9]/g, '').slice(0, 6)); setErrors({ ...errors, pincode: null }); }}
              placeholder="6 digits"
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={Colors.textSecondary}
            />
            {renderError('pincode')}
          </View>
        </View>

        <Text style={styles.label}>State *</Text>
        <TouchableOpacity
          style={[styles.dateInput, errors.state && styles.inputError]}
          onPress={() => setShowStatePicker(!showStatePicker)}
        >
          <MaterialIcons name="location-city" size={20} color={Colors.textSecondary} />
          <Text style={[styles.dateText, !state && styles.placeholderText]}>
            {state || 'Select state'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        {renderError('state')}

        {showStatePicker && (
          <View style={styles.stateList}>
            <ScrollView nestedScrollEnabled style={styles.stateScroll}>
              {INDIAN_STATES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.stateItem, state === s && styles.stateItemSelected]}
                  onPress={() => { setState(s); setShowStatePicker(false); setErrors({ ...errors, state: null }); }}
                >
                  <Text style={[styles.stateText, state === s && styles.stateTextSelected]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Image Section */}
        {renderSectionHeader('Crop Image', 'photo-camera')}

        {cropImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: cropImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
              <MaterialIcons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
              <MaterialIcons name="photo-library" size={32} color={Colors.primary} />
              <Text style={styles.imagePickerText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={handleTakePhoto}>
              <MaterialIcons name="camera-alt" size={32} color={Colors.primary} />
              <Text style={styles.imagePickerText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title="🔍 Test Network (Debug)"
          onPress={testNetworkConnection}
          variant="outline"
          icon="network-check"
          fullWidth
          style={{ marginTop: 20 }}
        />

        <Button
          title={isEditMode ? 'Update Crop' : 'Add Crop'}
          onPress={handleSubmit}
          loading={submitting}
          icon={isEditMode ? 'save' : 'add-circle'}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Date Pickers */}
      {showCultivationPicker && (
        <DateTimePicker
          value={cultivationDate || new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowCultivationPicker(false);
            if (event.type === 'set' && date) {
              setCultivationDate(date);
            }
          }}
        />
      )}

      {showHarvestPicker && (
        <DateTimePicker
          value={expectedHarvestDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowHarvestPicker(false);
            if (event.type === 'set' && date) {
              setExpectedHarvestDate(date);
              setErrors({ ...errors, expectedHarvestDate: null });
            }
          }}
        />
      )}

      <LoadingSpinner visible={submitting} overlay text={isEditMode ? 'Updating...' : 'Adding crop...'} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Increased from 40 to ensure submit button is always visible
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  unitContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitText: {
    fontSize: 12,
    color: Colors.text,
  },
  unitTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.primary,
  },
  stateList: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 200,
  },
  stateScroll: {
    maxHeight: 200,
  },
  stateItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stateItemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  stateText: {
    fontSize: 14,
    color: Colors.text,
  },
  stateTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 6,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  imagePickerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 40, // Increased from 32 for more breathing room
    marginBottom: 20, // Added bottom margin for extra space
  },
});

export default AddCropScreen;
