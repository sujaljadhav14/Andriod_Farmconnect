import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { addCrop, isCropApiConfigured } from '../../services/cropService';

const categories = ['Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices'];
const qualities = ['A+', 'A', 'B', 'C'];

const AddCropScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [quality, setQuality] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !category || !quantity || !price || !quality) {
      Alert.alert('Missing Details', 'Fill in all crop fields before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await addCrop({
        name,
        category,
        quantity,
        price,
        quality,
      });

      const successTitle = result.mode === 'remote' ? 'Crop Added' : 'Crop Added (Demo)';
      const successMessage =
        result.mode === 'remote'
          ? `${name.trim()} was saved to the crop backend.`
          : `${name.trim()} was saved in demo mode. Configure the crop API URL in src/services/cropService.js to use the backend.`;

      Alert.alert(successTitle, successMessage, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to add crop:', error);
      Alert.alert('Save Failed', 'The crop could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.banner}>
          <MaterialIcons
            name={isCropApiConfigured() ? 'cloud-done' : 'science'}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.bannerText}>
            {isCropApiConfigured()
              ? 'Crop API is configured for this app session.'
              : 'Crop API is not configured. Submissions currently save to demo memory only.'}
          </Text>
        </View>

        <Text style={styles.label}>Crop Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Wheat, Rice, Tomatoes"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipSelected]}
              onPress={() => setCategory(cat)}>
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Quantity (kg)</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 500"
          keyboardType="numeric"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Price per kg (\u20B9)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 28"
          keyboardType="numeric"
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>Quality Grade</Text>
        <View style={styles.chipContainer}>
          {qualities.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, quality === q && styles.chipSelected]}
              onPress={() => setQuality(q)}>
              <Text style={[styles.chipText, quality === q && styles.chipTextSelected]}>
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}>
          <MaterialIcons
            name={submitting ? 'hourglass-top' : 'add-circle'}
            size={22}
            color={Colors.white}
          />
          <Text style={styles.submitText}>{submitting ? 'Saving Crop...' : 'Add Crop'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    padding: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  bannerText: {
    flex: 1,
    marginLeft: 8,
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
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
    fontSize: 14,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddCropScreen;
