import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const mockProposals = [
  { id: '1', crop: 'Rice (Basmati)', farmer: 'Sunil Jadhav', proposedPrice: '\u20B960/kg', qty: '1000 kg', status: 'Pending', date: '26 Jan 2025' },
  { id: '2', crop: 'Mangoes', farmer: 'Ganesh Pawar', proposedPrice: '\u20B9180/kg', qty: '300 kg', status: 'Accepted', date: '24 Jan 2025' },
  { id: '3', crop: 'Turmeric', farmer: 'Vinod More', proposedPrice: '\u20B9110/kg', qty: '150 kg', status: 'Rejected', date: '20 Jan 2025' },
  { id: '4', crop: 'Soybean', farmer: 'Mahesh Kulkarni', proposedPrice: '\u20B950/kg', qty: '600 kg', status: 'Pending', date: '28 Jan 2025' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return '#E65100';
    case 'Accepted': return '#2E7D32';
    case 'Rejected': return '#D32F2F';
    default: return Colors.textSecondary;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Pending': return 'hourglass-empty';
    case 'Accepted': return 'check-circle';
    case 'Rejected': return 'cancel';
    default: return 'help';
  }
};

const MyProposalsScreen = () => {
  const renderProposal = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{item.crop}</Text>
          <Text style={styles.farmerName}>To: {item.farmer}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <MaterialIcons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Proposed</Text>
          <Text style={styles.detailValue}>{item.proposedPrice}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{item.qty}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{item.date}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={mockProposals}
      renderItem={renderProposal}
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  farmerName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12,
  },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: Colors.text, marginTop: 2 },
});

export default MyProposalsScreen;
