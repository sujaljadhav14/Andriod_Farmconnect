/**
 * Received Proposals Screen - Farmer
 * Shows proposals received from traders with accept/reject actions
 * NO DEMO DATA - All data from real backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import proposalService from '../../services/proposalService';
import { LoadingSpinner } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Accepted', label: 'Accepted' },
  { key: 'Rejected', label: 'Rejected' },
];

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#E65100';
    case 'accepted':
      return '#2E7D32';
    case 'rejected':
      return '#D32F2F';
    case 'withdrawn':
      return '#757575';
    default:
      return Colors.textSecondary;
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'hourglass-empty';
    case 'accepted':
      return 'check-circle';
    case 'rejected':
      return 'cancel';
    case 'withdrawn':
      return 'undo';
    default:
      return 'help';
  }
};

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

const ReceivedProposalsScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadProposals = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await proposalService.getFarmerProposals();
      const normalizedProposals = proposalService.normalizeProposals(
        response.proposals || response.data || []
      );
      setProposals(normalizedProposals);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setError(err.message || 'Failed to load proposals');
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadProposals();
    }
  }, [isFocused, loadProposals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProposals(false);
  }, [loadProposals]);

  const handleAccept = (proposal) => {
    Alert.alert(
      'Accept Proposal',
      `Are you sure you want to accept the proposal from ${proposal.trader?.name || 'the trader'}?\n\nThis will create an order for ${proposal.proposedQuantity} ${proposal.crop?.unit || 'kg'} at ${formatCurrency(proposal.proposedPrice)}/${proposal.crop?.unit || 'kg'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              await proposalService.acceptProposal(proposal.id);
              // Update local state
              setProposals(proposals.map(p =>
                p.id === proposal.id ? { ...p, status: 'Accepted' } : p
              ));
              Alert.alert(
                'Proposal Accepted',
                'The proposal has been accepted. An order has been created.',
                [{ text: 'View Orders', onPress: () => navigation.navigate('MyOrders') }, { text: 'OK' }]
              );
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to accept proposal');
            }
          },
        },
      ]
    );
  };

  const handleRejectPress = (proposal) => {
    setSelectedProposal(proposal);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProposal) return;

    try {
      await proposalService.rejectProposal(selectedProposal.id, rejectReason.trim() || 'No reason provided');
      // Update local state
      setProposals(proposals.map(p =>
        p.id === selectedProposal.id
          ? { ...p, status: 'Rejected', rejectionReason: rejectReason.trim() || 'No reason provided' }
          : p
      ));
      setRejectModalVisible(false);
      setSelectedProposal(null);
      Alert.alert('Proposal Rejected', 'The proposal has been rejected.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to reject proposal');
    }
  };

  const filteredProposals = selectedTab === 'all'
    ? proposals
    : proposals.filter(p => p.status?.toLowerCase() === selectedTab.toLowerCase());

  const renderProposal = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {/* Crop Image or Icon */}
        <View style={styles.cropImageContainer}>
          {item.crop?.cropImage ? (
            <Image source={{ uri: item.crop.cropImage }} style={styles.cropImage} />
          ) : (
            <View style={styles.cropImagePlaceholder}>
              <MaterialIcons
                name={getCategoryIcon(item.crop?.category)}
                size={24}
                color={Colors.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={styles.cropInfo}>
          <Text style={styles.cropName} numberOfLines={1}>
            {item.crop?.cropName || 'Unknown Crop'}
          </Text>
          <Text style={styles.traderName} numberOfLines={1}>
            From: {item.trader?.name || 'Trader'}
          </Text>
          {item.trader?.phone && (
            <Text style={styles.traderPhone}>+91 {item.trader.phone}</Text>
          )}
        </View>

        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <MaterialIcons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardMiddle}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Offered Price</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(item.proposedPrice)}/{item.crop?.unit || 'kg'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>
            {item.proposedQuantity} {item.crop?.unit || 'kg'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, styles.totalValue]}>
            {formatCurrency(item.totalAmount)}
          </Text>
        </View>
      </View>

      {item.paymentTerms && (
        <View style={styles.paymentTermsRow}>
          <MaterialIcons name="payments" size={14} color={Colors.textSecondary} />
          <Text style={styles.paymentTermsText}>Payment: {item.paymentTerms}</Text>
        </View>
      )}

      {item.message && (
        <View style={styles.messageContainer}>
          <MaterialIcons name="chat-bubble-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.messageText} numberOfLines={3}>{item.message}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.status?.toLowerCase() === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectPress(item)}
            >
              <MaterialIcons name="close" size={16} color={Colors.error} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item)}
            >
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status?.toLowerCase() === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionReasonContainer}>
            <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
            <Text style={styles.rejectionReasonText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading proposals..." />;
  }

  return (
    <View style={styles.container}>
      {/* Status Tabs */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, selectedTab === item.key && styles.tabActive]}
              onPress={() => setSelectedTab(item.key)}
            >
              <Text style={[styles.tabText, selectedTab === item.key && styles.tabTextActive]}>
                {item.label}
              </Text>
              {selectedTab === item.key && (
                <Text style={styles.tabCount}>
                  ({item.key === 'all'
                    ? proposals.length
                    : proposals.filter(p => p.status?.toLowerCase() === item.key.toLowerCase()).length})
                </Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.tabList}
        />
      </View>

      {/* Proposals List */}
      <FlatList
        data={filteredProposals}
        renderItem={renderProposal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          filteredProposals.length > 0 ? (
            <Text style={styles.resultCount}>
              {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {error ? 'Failed to load proposals' : 'No proposals found'}
            </Text>
            <Text style={styles.emptyText}>
              {error ||
                (selectedTab === 'all'
                  ? 'When traders are interested in your crops, their proposals will appear here'
                  : `No ${selectedTab.toLowerCase()} proposals`)}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadProposals()}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Proposal</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting this proposal (optional):
            </Text>

            <TextInput
              style={styles.rejectReasonInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g., Price too low, already sold, etc."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <Text style={styles.charCount}>{rejectReason.length}/200</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={handleRejectConfirm}
              >
                <Text style={styles.modalRejectText}>Reject Proposal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  list: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cropImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  traderName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  traderPhone: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 2,
  },
  totalValue: {
    color: Colors.primary,
    fontWeight: '600',
  },
  paymentTermsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentTermsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    marginLeft: 6,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'column',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  rejectButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
    marginLeft: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
  },
  acceptButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  rejectionReasonContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '500',
  },
  rejectionReasonText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  rejectReasonInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalRejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  modalRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReceivedProposalsScreen;
