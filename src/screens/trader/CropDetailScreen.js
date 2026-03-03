import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const CropDetailScreen = ({ route }) => {
  const { crop } = route.params;

  const handlePlaceOrder = () => {
    Alert.alert('Order Placed (Demo)', `Your order for ${crop.name} has been placed.\nThis is a demo - no real order created.`);
  };

  const handleMakeProposal = () => {
    Alert.alert('Proposal Sent (Demo)', `Your proposal for ${crop.name} has been sent to ${crop.farmer}.\nThis is a demo - no real proposal created.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageplaceholder}>
        <MaterialIcons name="image" size={64} color={Colors.textSecondary} />
        <Text style={styles.imagePlaceholderText}>Crop Image</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{crop.name}</Text>
        <Text style={styles.farmer}>{crop.farmer} - {crop.location}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{crop.price}</Text>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>Grade {crop.quality}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialIcons name="category" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{crop.category}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MaterialIcons name="inventory" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>{crop.quantity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{crop.location}, Maharashtra</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder}>
          <MaterialIcons name="shopping-cart" size={20} color={Colors.white} />
          <Text style={styles.orderButtonText}>Place Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.proposalButton} onPress={handleMakeProposal}>
          <MaterialIcons name="send" size={20} color="#E65100" />
          <Text style={styles.proposalButtonText}>Make Proposal</Text>
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
  imageplaceholder: {
    height: 200,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  farmer: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E65100',
  },
  qualityBadge: {
    backgroundColor: '#2E7D32' + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  qualityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  orderButton: {
    backgroundColor: '#E65100',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  orderButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  proposalButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E65100',
  },
  proposalButtonText: {
    color: '#E65100',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CropDetailScreen;
