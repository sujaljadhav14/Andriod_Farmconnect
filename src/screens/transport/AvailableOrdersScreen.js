import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockAvailableOrders = [
  { id: '1', from: 'Nashik', to: 'Mumbai', distance: '180 km', crop: 'Rice (1000kg)', pay: '\u20B93,500', pickupDate: '30 Jan 2025' },
  { id: '2', from: 'Pune', to: 'Kolhapur', distance: '230 km', crop: 'Onions (800kg)', pay: '\u20B94,200', pickupDate: '1 Feb 2025' },
  { id: '3', from: 'Ahmednagar', to: 'Solapur', distance: '150 km', crop: 'Soybean (600kg)', pay: '\u20B92,800', pickupDate: '2 Feb 2025' },
  { id: '4', from: 'Ratnagiri', to: 'Pune', distance: '330 km', crop: 'Mangoes (300kg)', pay: '\u20B96,000', pickupDate: '5 Feb 2025' },
];

const AvailableOrdersScreen = () => {
  const handleAccept = (order) => {
    Alert.alert('Delivery Accepted (Demo)', `You accepted delivery of ${order.crop}\n${order.from} to ${order.to}\nThis is a demo.`);
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.routeRow}>
        <MaterialIcons name="radio-button-checked" size={16} color="#2E7D32" />
        <Text style={styles.routeFrom}>{item.from}</Text>
        <MaterialIcons name="more-horiz" size={16} color={Colors.textSecondary} />
        <Text style={styles.distance}>{item.distance}</Text>
        <MaterialIcons name="more-horiz" size={16} color={Colors.textSecondary} />
        <MaterialIcons name="location-on" size={16} color="#D32F2F" />
        <Text style={styles.routeTo}>{item.to}</Text>
      </View>
      <Text style={styles.crop}>{item.crop}</Text>
      <Text style={styles.pickup}>Pickup: {item.pickupDate}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.pay}>{item.pay}</Text>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={mockAvailableOrders}
      renderItem={renderOrder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  routeFrom: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4, marginRight: 4 },
  routeTo: { fontSize: 14, fontWeight: '500', color: Colors.text, marginLeft: 4 },
  distance: { fontSize: 12, color: Colors.textSecondary, marginHorizontal: 4 },
  crop: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  pickup: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
  pay: { fontSize: 18, fontWeight: 'bold', color: '#1565C0' },
  acceptBtn: { backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
});

export default AvailableOrdersScreen;
