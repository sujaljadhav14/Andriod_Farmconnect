import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import analyticsService from '../../services/analyticsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const RELATIONSHIP_FILTERS = ['all', 'strong', 'growing', 'new'];

const statusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'verified') return '#2E7D32';
  if (normalized === 'submitted') return '#1565C0';
  if (normalized === 'rejected') return '#D32F2F';
  return '#757575';
};

const FarmerNetworkScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [farmers, setFarmers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');

  const loadNetwork = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await analyticsService.getFarmerNetwork();
      setFarmers(response || []);
    } catch (loadError) {
      console.error('Farmer network load error:', loadError);
      setError(loadError.message || 'Failed to load farmer network');
      setFarmers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadNetwork();
    }
  }, [isFocused, loadNetwork]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNetwork(false);
  }, [loadNetwork]);

  const filteredFarmers = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return farmers.filter((farmer) => {
      const matchesFilter = relationshipFilter === 'all' || farmer.relationshipStrength === relationshipFilter;
      if (!matchesFilter) return false;

      if (!search) return true;

      const searchable = [
        farmer.name,
        farmer.phone,
        farmer.city,
        farmer.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [farmers, relationshipFilter, searchText]);

  const summary = useMemo(() => {
    const totalInteractions = farmers.reduce((sum, farmer) => sum + Number(farmer.totalInteractions || 0), 0);
    const totalValue = farmers.reduce((sum, farmer) => sum + Number(farmer.totalRevenue || 0), 0);

    return {
      totalFarmers: farmers.length,
      totalInteractions,
      totalValue,
    };
  }, [farmers]);

  const openDialer = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={styles.loadingText}>Loading farmer network...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E65100']} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>Farmer Network</Text>
        <Text style={styles.description}>
          Relationship intelligence from proposals, transactions, and completed deals.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Farmers</Text>
            <Text style={styles.summaryValue}>{summary.totalFarmers}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Interactions</Text>
            <Text style={styles.summaryValue}>{summary.totalInteractions}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Trade Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalValue)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, city"
          placeholderTextColor={Colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {RELATIONSHIP_FILTERS.map((filter) => {
            const selected = relationshipFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setRelationshipFilter(filter)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredFarmers.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="people-outline" size={32} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No network records</Text>
          <Text style={styles.emptyText}>Engage with farmers through proposals to build your network.</Text>
        </View>
      ) : (
        filteredFarmers.map((farmer) => (
          <View key={farmer.farmerId} style={styles.farmerCard}>
            <View style={styles.farmerHeader}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.farmerName}>{farmer.name}</Text>
                <Text style={styles.farmerLocation}>
                  {farmer.city || 'Unknown city'}{farmer.state ? `, ${farmer.state}` : ''}
                </Text>
              </View>

              <View style={[styles.relationshipBadge, farmer.relationshipStrength === 'strong' ? styles.relationshipStrong : farmer.relationshipStrength === 'growing' ? styles.relationshipGrowing : styles.relationshipNew]}>
                <Text style={[styles.relationshipBadgeText, farmer.relationshipStrength === 'strong' ? styles.relationshipStrongText : farmer.relationshipStrength === 'growing' ? styles.relationshipGrowingText : styles.relationshipNewText]}>
                  {(farmer.relationshipStrength || 'new').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Proposals</Text>
                <Text style={styles.metricValue}>{farmer.proposalCount || 0}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Orders</Text>
                <Text style={styles.metricValue}>{farmer.orderCount || 0}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Completed</Text>
                <Text style={styles.metricValue}>{farmer.completedOrders || 0}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Revenue</Text>
                <Text style={styles.metricValue}>{formatCurrency(farmer.totalRevenue || 0)}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={[styles.kycText, { color: statusColor(farmer.kycStatus) }]}>
                KYC: {(farmer.kycStatus || 'pending').toUpperCase()}
              </Text>
              <Text style={styles.lastSeenText}>
                Last interaction: {farmer.lastInteractionAt ? formatDate(farmer.lastInteractionAt, 'short') : 'N/A'}
              </Text>
            </View>

            {!!farmer.phone && (
              <TouchableOpacity style={styles.callBtn} onPress={() => openDialer(farmer.phone)}>
                <MaterialIcons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.callBtnText}>Call {farmer.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  headerCard: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    color: '#E65100',
    fontWeight: '700',
  },
  description: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  summaryValue: {
    marginTop: 3,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
  },
  filterChipActive: {
    borderColor: '#E65100',
    backgroundColor: '#FFE0B2',
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#E65100',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  farmerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  farmerName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  farmerLocation: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  relationshipBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relationshipStrong: {
    borderColor: '#A5D6A7',
    backgroundColor: '#E8F5E9',
  },
  relationshipGrowing: {
    borderColor: '#90CAF9',
    backgroundColor: '#E3F2FD',
  },
  relationshipNew: {
    borderColor: '#FFE082',
    backgroundColor: '#FFF8E1',
  },
  relationshipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  relationshipStrongText: {
    color: '#2E7D32',
  },
  relationshipGrowingText: {
    color: '#1565C0',
  },
  relationshipNewText: {
    color: '#E65100',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metricCell: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  metricValue: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kycText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lastSeenText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  callBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E65100',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  callBtnText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    marginLeft: 8,
    color: Colors.error,
    fontSize: 12,
    flex: 1,
  },
});

export default FarmerNetworkScreen;