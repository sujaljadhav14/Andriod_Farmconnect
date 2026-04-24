import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import transportService from '../../services/transportService';
import { LoadingSpinner } from '../../components/common';

const toRouteQuery = (pickup, destination) => {
  const origin = encodeURIComponent(pickup || 'Current Location');
  const target = encodeURIComponent(destination || 'Destination');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${target}&travelmode=driving`;
};

const RoutePlanningScreen = () => {
  const isFocused = useIsFocused();
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await transportService.getMyDeliveries({ status: 'active' });
      const normalized = transportService.normalizeDeliveries(response.data || response.orders || []);
      setActiveDeliveries(normalized);
    } catch (err) {
      console.error('Failed to load active routes:', err);
      setError(err.message || 'Failed to load active routes');
      setActiveDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadRoutes();
    }
  }, [isFocused, loadRoutes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoutes(false);
  }, [loadRoutes]);

  const openGoogleMaps = async (delivery) => {
    const pickup = delivery.pickupAddress || delivery.pickupCity || 'Pickup Location';
    const destination = delivery.deliveryAddress || delivery.deliveryCity || 'Delivery Location';
    const routeUrl = toRouteQuery(pickup, destination);

    try {
      await Linking.openURL(routeUrl);
    } catch (err) {
      console.warn('Failed to open maps:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.crop}>{item.cropName}</Text>
        <Text style={styles.order}>#{item.orderNumber}</Text>
      </View>

      <View style={styles.pointRow}>
        <MaterialIcons name="radio-button-checked" size={14} color="#2E7D32" />
        <View style={styles.pointContent}>
          <Text style={styles.pointLabel}>Pickup</Text>
          <Text style={styles.pointValue}>{item.pickupAddress || item.pickupCity || 'Not available'}</Text>
        </View>
      </View>

      <View style={styles.pathDivider} />

      <View style={styles.pointRow}>
        <MaterialIcons name="location-on" size={14} color="#D32F2F" />
        <View style={styles.pointContent}>
          <Text style={styles.pointLabel}>Drop</Text>
          <Text style={styles.pointValue}>{item.deliveryAddress || item.deliveryCity || 'Not available'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.navBtn} onPress={() => openGoogleMaps(item)}>
        <MaterialIcons name="navigation" size={16} color={Colors.white} />
        <Text style={styles.navBtnText}>Navigate Route</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingSpinner text="Loading routes..." />;
  }

  return (
    <FlatList
      style={styles.container}
      data={activeDeliveries}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1565C0']} />}
      ListHeaderComponent={
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Active Routes</Text>
          <Text style={styles.headerSub}>{activeDeliveries.length} delivery route(s) currently active</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <MaterialIcons name="map" size={46} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>{error ? 'Unable to load routes' : 'No active routes'}</Text>
          <Text style={styles.emptyText}>{error || 'Accept a delivery to start route planning.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadRoutes()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16 },
  headerCard: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#E3F2FD', marginTop: 4, fontSize: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  crop: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  order: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pointContent: { marginLeft: 8, flex: 1 },
  pointLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  pointValue: { marginTop: 2, fontSize: 13, color: Colors.text },
  pathDivider: { marginVertical: 10, marginLeft: 7, borderLeftWidth: 1, borderLeftColor: Colors.border, height: 12 },
  navBtn: {
    marginTop: 12,
    backgroundColor: '#1565C0',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  navBtnText: { marginLeft: 6, color: Colors.white, fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', marginTop: 90, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { marginTop: 8, fontSize: 14, textAlign: 'center', color: Colors.textSecondary },
  retryBtn: { marginTop: 16, backgroundColor: '#1565C0', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: Colors.white, fontWeight: '600' },
});

export default RoutePlanningScreen;
