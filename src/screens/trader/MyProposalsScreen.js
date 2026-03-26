/**
 * My Proposals Screen - Trader
 * Shows all proposals made by the trader
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
  { key: 'Withdrawn', label: 'Withdrawn' },
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

const MyProposalsScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');

  const loadProposals = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await proposalService.getTraderProposals();
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

  const handleWithdraw = (proposalId, cropName) => {
    Alert.alert(
      'Withdraw Proposal',
      `Are you sure you want to withdraw your proposal for "${cropName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await proposalService.withdrawProposal(proposalId);
              // Update local state
              setProposals(proposals.map(p =>
                p.id === proposalId ? { ...p, status: 'Withdrawn' } : p
              ));
              Alert.alert('Success', 'Proposal withdrawn successfully.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to withdraw proposal');
            }
          },
        },
      ]
    );
  };

  const filteredProposals = selectedTab === 'all'
    ? proposals
    : proposals.filter(p => p.status?.toLowerCase() === selectedTab.toLowerCase());

  const renderProposal = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => {
        if (item.crop?.id) {
          navigation.navigate('CropDetail', { cropId: item.crop.id });
        }
      }}
    >
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
          <Text style={styles.farmerName} numberOfLines={1}>
            To: {item.farmer?.name || 'Farmer'}
          </Text>
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
          <Text style={styles.detailLabel}>Proposed Price</Text>
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

      <View style={styles.cardBottom}>
        <View style={styles.dateInfo}>
          <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.status?.toLowerCase() === 'pending' && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => handleWithdraw(item.id, item.crop?.cropName)}
          >
            <MaterialIcons name="undo" size={16} color={Colors.error} />
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        )}

        {item.status?.toLowerCase() === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionReason}>
            <Text style={styles.rejectionLabel}>Reason:</Text>
            <Text style={styles.rejectionText} numberOfLines={1}>
              {item.rejectionReason}
            </Text>
          </View>
        )}
      </View>

      {item.message && (
        <View style={styles.messageContainer}>
          <MaterialIcons name="chat-bubble-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
        </View>
      )}
    </TouchableOpacity>
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
            colors={['#E65100']}
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
                  ? 'Browse crops and make proposals to start trading'
                  : `No ${selectedTab.toLowerCase()} proposals`)}
            </Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => loadProposals()}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
            {!error && selectedTab === 'all' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text style={styles.browseButtonText}>Browse Crops</Text>
              </TouchableOpacity>
            )}
          </View>
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
    backgroundColor: '#E65100',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  cropImageContainer: {
    width: 48,
    height: 48,
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
  farmerName: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    color: '#E65100',
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  withdrawText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
    marginLeft: 4,
  },
  rejectionReason: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  rejectionLabel: {
    fontSize: 11,
    color: Colors.error,
    marginRight: 4,
  },
  rejectionText: {
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 120,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
    lineHeight: 16,
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
    backgroundColor: '#E65100',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  browseButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E65100',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MyProposalsScreen;
