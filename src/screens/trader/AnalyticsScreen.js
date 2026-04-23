import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import analyticsService from '../../services/analyticsService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const DAY_FILTERS = [7, 14, 30];

const AnalyticsScreen = () => {
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedDays, setSelectedDays] = useState(14);
  const [priceTrend, setPriceTrend] = useState([]);
  const [categoryAverages, setCategoryAverages] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    totalSpend: 0,
    averageOrderValue: 0,
  });
  const [topCrops, setTopCrops] = useState([]);
  const [topFarmers, setTopFarmers] = useState([]);

  const loadAnalytics = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const [trendResponse, cropsResponse] = await Promise.all([
        analyticsService.getPriceTrend(selectedDays),
        analyticsService.getTopCrops(),
      ]);

      setPriceTrend(trendResponse?.points || []);
      setCategoryAverages(trendResponse?.categoryAverages || []);
      setSummary(cropsResponse?.summary || {});
      setTopCrops(cropsResponse?.topCrops || []);
      setTopFarmers(cropsResponse?.topFarmers || []);
    } catch (loadError) {
      console.error('Analytics load error:', loadError);
      setError(loadError.message || 'Failed to load analytics data');
      setPriceTrend([]);
      setCategoryAverages([]);
      setTopCrops([]);
      setTopFarmers([]);
      setSummary({
        totalOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        totalSpend: 0,
        averageOrderValue: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    if (isFocused) {
      loadAnalytics();
    }
  }, [isFocused, loadAnalytics]);

  useEffect(() => {
    if (!loading) {
      loadAnalytics(false);
    }
  }, [selectedDays]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalytics(false);
  }, [loadAnalytics]);

  const trendMax = useMemo(() => {
    if (!priceTrend.length) return 1;
    return Math.max(...priceTrend.map((point) => Number(point.averagePrice || 0)), 1);
  }, [priceTrend]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E65100" />
        <Text style={styles.loadingText}>Loading market analytics...</Text>
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
        <Text style={styles.title}>Market Analytics</Text>
        <Text style={styles.description}>
          Live analytics based on your transaction activity and active crop listings.
        </Text>

        <View style={styles.dayFilterRow}>
          {DAY_FILTERS.map((days) => {
            const selected = selectedDays === days;
            return (
              <TouchableOpacity
                key={days}
                style={[styles.dayFilterChip, selected && styles.dayFilterChipActive]}
                onPress={() => setSelectedDays(days)}
              >
                <Text style={[styles.dayFilterText, selected && styles.dayFilterTextActive]}>{days}D</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>{summary.totalOrders || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active Orders</Text>
          <Text style={styles.summaryValue}>{summary.activeOrders || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{summary.completedOrders || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spend</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalSpend || 0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Price Trend ({selectedDays} days)</Text>

        {priceTrend.length === 0 ? (
          <View style={styles.emptyBlock}>
            <MaterialIcons name="show-chart" size={28} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No trend data available in this period.</Text>
          </View>
        ) : (
          <>
            <View style={styles.trendChartRow}>
              {priceTrend.slice(-12).map((point) => {
                const normalizedHeight = Math.max(14, (Number(point.averagePrice || 0) / trendMax) * 110);
                return (
                  <View key={point.day} style={styles.trendColumn}>
                    <View style={[styles.trendBar, { height: normalizedHeight }]} />
                    <Text style={styles.trendDay}>{point.day.slice(5)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.trendLegendRow}>
              <Text style={styles.legendText}>Avg: {formatCurrency(priceTrend[priceTrend.length - 1]?.averagePrice || 0)}</Text>
              <Text style={styles.legendText}>Range: {formatCurrency(priceTrend[priceTrend.length - 1]?.minPrice || 0)} - {formatCurrency(priceTrend[priceTrend.length - 1]?.maxPrice || 0)}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category Averages</Text>
        {categoryAverages.length === 0 ? (
          <Text style={styles.subtleText}>No category snapshots available.</Text>
        ) : (
          categoryAverages.slice(0, 6).map((item) => (
            <View key={item.category} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{item.category}</Text>
              <Text style={styles.dataValue}>{formatCurrency(item.averagePrice)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Crops by Revenue</Text>
        {topCrops.length === 0 ? (
          <Text style={styles.subtleText}>No top crop analytics available yet.</Text>
        ) : (
          topCrops.map((crop, index) => (
            <View key={`${crop.cropId || crop.cropName}-${index}`} style={styles.rankCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>#{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankTitle}>{crop.cropName}</Text>
                <Text style={styles.rankSubtext}>{crop.category} • {crop.ordersCount} orders</Text>
              </View>
              <Text style={styles.rankValue}>{formatCurrency(crop.totalRevenue || 0)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Partner Farmers</Text>
        {topFarmers.length === 0 ? (
          <Text style={styles.subtleText}>No farmer partnership analytics yet.</Text>
        ) : (
          topFarmers.slice(0, 8).map((farmer, index) => (
            <View key={`${farmer.farmerId || farmer.name}-${index}`} style={styles.partnerRow}>
              <View style={styles.partnerAvatar}>
                <MaterialIcons name="person" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>{farmer.name}</Text>
                <Text style={styles.partnerMeta}>
                  {farmer.city || 'Unknown city'} • {farmer.ordersCount || 0} deals
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.partnerValue}>{formatCurrency(farmer.totalRevenue || 0)}</Text>
                <Text style={styles.partnerMetaSmall}>
                  {farmer.lastTradeAt ? formatDate(farmer.lastTradeAt, 'short') : 'No trade date'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E65100',
  },
  description: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  dayFilterRow: {
    flexDirection: 'row',
  },
  dayFilterChip: {
    borderWidth: 1,
    borderColor: '#FFCC80',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  dayFilterChipActive: {
    borderColor: '#E65100',
    backgroundColor: '#FFE0B2',
  },
  dayFilterText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '700',
  },
  dayFilterTextActive: {
    color: '#BF360C',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 4,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    margin: '1%',
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trendChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 128,
    paddingBottom: 6,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  trendBar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#E65100',
    minHeight: 14,
  },
  trendDay: {
    marginTop: 6,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  trendLegendRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  subtleText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  dataLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '700',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '700',
  },
  rankTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  rankSubtext: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  rankValue: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '700',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
    paddingBottom: 10,
  },
  partnerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
  },
  partnerMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  partnerValue: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '700',
  },
  partnerMetaSmall: {
    marginTop: 2,
    fontSize: 10,
    color: Colors.textSecondary,
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

export default AnalyticsScreen;