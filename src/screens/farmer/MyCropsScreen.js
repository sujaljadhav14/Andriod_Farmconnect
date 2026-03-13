import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const API_URL = "http://192.168.1.103:5050";

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

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCrops = async () => {
    try {

      const response = await fetch(`${API_URL}/crops`);
      const data = await response.json();

      setCrops(data);

    } catch (error) {

      console.log("Error fetching crops:", error);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const renderCrop = ({ item }) => (

    <TouchableOpacity style={styles.cropCard} activeOpacity={0.7}>

      <View style={styles.cropHeader}>

        <View style={styles.cropIconContainer}>
          <MaterialIcons
            name={getCategoryIcon(item.category)}
            size={24}
            color={Colors.primary}
          />
        </View>

        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{item.cropName}</Text>
          <Text style={styles.cropCategory}>{item.category}</Text>
        </View>

      </View>

      <View style={styles.cropDetails}>

        <View style={styles.detailItem}>
          <MaterialIcons name="inventory" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>{item.quantity} kg</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="payments" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>₹{item.price}/kg</Text>
        </View>

        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>Grade {item.qualityGrade}</Text>
        </View>

      </View>

    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (

    <View style={styles.container}>

      <FlatList
        data={crops}
        renderItem={renderCrop}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryText}>{crops.length} crops listed</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCrop')}
        activeOpacity={0.8}
      >
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
    justifyContent: "center",
    alignItems: "center"
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
  },

});

export default MyCropsScreen;