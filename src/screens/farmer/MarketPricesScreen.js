import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import marketService from '../../services/marketService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CATEGORY_FILTERS = ['all', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Spices', 'Other'];

const MarketPricesScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadMarketPrices = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const filters = selectedCategory === 'all' ? {} : { category: selectedCategory };
      const response = await marketService.getMarketPrices(filters);
      setPrices(response?.data || []);
    } catch (loadError) {
      console.error('Market prices load error:', loadError);
      setError(loadError.message || 'Failed to load market prices');
      setPrices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (isFocused) {
      loadMarketPrices();
    }
  }, [isFocused, loadMarketPrices]);

  useEffect(() => {
    if (!loading) {
      loadMarketPrices(false);
    }
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMarketPrices(false);
  }, [loadMarketPrices]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading market prices...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>Market Prices</Text>
        <Text style={styles.description}>
          Live rates are derived from currently available crop listings across active markets.
        </Text>

        <View style={styles.filterWrap}>
          {CATEGORY_FILTERS.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {category === 'all' ? 'All' : category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Commodities</Text>
          <Text style={styles.summaryValue}>{prices.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Top Average Rate</Text>
          <Text style={styles.summaryValue}>
            {prices[0] ? `${formatCurrency(prices[0].averagePrice)}/${prices[0].unit}` : 'N/A'}
          </Text>
        </View>
      </View>

      {prices.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons name="bar-chart" size={30} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No market prices found</Text>
          <Text style={styles.emptyText}>Try switching category or refresh when new crop listings are available.</Text>
        </View>
      ) : (
        prices.map((item) => (
          <View key={item.id} style={styles.priceCard}>
            <View style={styles.priceCardHeader}>
              <View>
                <Text style={styles.cropName}>{item.cropName}</Text>
                <Text style={styles.cropCategory}>{item.category}</Text>
              </View>
              <View style={[styles.trendBadge, item.trend === 'volatile' ? styles.trendVolatile : styles.trendStable]}>
                <Text style={[styles.trendBadgeText, item.trend === 'volatile' ? styles.trendVolatileText : styles.trendStableText]}>
                  {item.trend === 'volatile' ? 'Volatile' : 'Stable'}
                </Text>
              </View>
            </View>

            <View style={styles.priceMetrics}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Average</Text>
                <Text style={styles.metricValue}>{formatCurrency(item.averagePrice)}/{item.unit}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Min</Text>
                <Text style={styles.metricSubValue}>{formatCurrency(item.minPrice)}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Max</Text>
                <Text style={styles.metricSubValue}>{formatCurrency(item.maxPrice)}</Text>
              </View>
            </View>

            <Text style={styles.marketsText}>
              Markets: {item.markets?.length ? item.markets.join(' | ') : 'Not specified'}
            </Text>
            <Text style={styles.updatedText}>Updated: {formatDate(item.lastUpdated)}</Text>
          </View>
        ))
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cropCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  trendStable: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  trendVolatile: {
    borderColor: '#E65100',
    backgroundColor: '#FFF3E0',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trendStableText: {
    color: '#2E7D32',
  },
  trendVolatileText: {
    color: '#E65100',
  },
  priceMetrics: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricSubValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  marketsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  updatedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 10,
    marginTop: 4,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
});

export default MarketPricesScreen;