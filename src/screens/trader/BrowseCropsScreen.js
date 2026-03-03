import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const allCrops = [
  { id: '1', name: 'Wheat', farmer: 'Ramesh Patil', location: 'Nashik', quantity: '500 kg', price: '\u20B928/kg', quality: 'A+', category: 'Grains' },
  { id: '2', name: 'Rice (Basmati)', farmer: 'Sunil Jadhav', location: 'Pune', quantity: '1000 kg', price: '\u20B965/kg', quality: 'A', category: 'Grains' },
  { id: '3', name: 'Tomatoes', farmer: 'Priya Deshmukh', location: 'Satara', quantity: '200 kg', price: '\u20B940/kg', quality: 'A', category: 'Vegetables' },
  { id: '4', name: 'Onions', farmer: 'Arun Shinde', location: 'Ahmednagar', quantity: '800 kg', price: '\u20B922/kg', quality: 'B', category: 'Vegetables' },
  { id: '5', name: 'Turmeric', farmer: 'Vinod More', location: 'Sangli', quantity: '150 kg', price: '\u20B9120/kg', quality: 'A+', category: 'Spices' },
  { id: '6', name: 'Soybean', farmer: 'Mahesh Kulkarni', location: 'Latur', quantity: '600 kg', price: '\u20B955/kg', quality: 'A', category: 'Pulses' },
  { id: '7', name: 'Mangoes (Alphonso)', farmer: 'Ganesh Pawar', location: 'Ratnagiri', quantity: '300 kg', price: '\u20B9200/kg', quality: 'A+', category: 'Fruits' },
];

const BrowseCropsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filtered = allCrops.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.farmer.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
  );

  const renderCrop = ({ item }) => (
    <TouchableOpacity
      style={styles.cropCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CropDetail', { crop: item })}>
      <View style={styles.cropHeader}>
        <View>
          <Text style={styles.cropName}>{item.name}</Text>
          <Text style={styles.cropFarmer}>{item.farmer} - {item.location}</Text>
        </View>
        <Text style={styles.cropPrice}>{item.price}</Text>
      </View>
      <View style={styles.cropFooter}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.category}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Grade {item.quality}</Text>
        </View>
        <Text style={styles.qty}>{item.quantity} available</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={22} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search crops, farmers, locations..."
          placeholderTextColor={Colors.textSecondary}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        renderItem={renderCrop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No crops found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    marginBottom: 0,
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
  list: {
    padding: 16,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cropFarmer: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cropPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
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
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 40,
  },
});

export default BrowseCropsScreen;
