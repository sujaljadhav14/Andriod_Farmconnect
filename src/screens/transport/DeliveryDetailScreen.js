import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import transportService from '../../services/transportService';
import socketService from '../../services/socketService';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const formatCoordinate = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(6);
};

const canTrackStatus = (status) => ['in_transit', 'ready_for_pickup'].includes((status || '').toLowerCase());

const DeliveryDetailScreen = ({ route }) => {
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const deliveryId = route.params?.deliveryId;

  const [delivery, setDelivery] = useState(null);
  const [tracking, setTracking] = useState({
    currentLocation: null,
    recentPath: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const watchSubscriptionRef = useRef(null);
  const pollingRef = useRef(null);
  const socketHandlersRef = useRef(null);

  const stopLiveTracking = useCallback(() => {
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
    }
    setTrackingActive(false);
  }, []);

  const loadDeliveryDetails = useCallback(async (showLoader = true) => {
    if (!deliveryId) {
      setError('Delivery ID is missing');
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [detailResponse, locationResponse] = await Promise.all([
        transportService.getDeliveryDetails(deliveryId),
        transportService.getDeliveryLocation(deliveryId).catch(() => null),
      ]);

      const normalizedDelivery = transportService.normalizeDelivery(detailResponse.data || detailResponse.order || {});
      setDelivery(normalizedDelivery);

      if (locationResponse?.data) {
        const normalizedLocation = transportService.normalizeLocationData(locationResponse.data);
        setTracking({
          currentLocation: normalizedLocation.currentLocation,
          recentPath: normalizedLocation.recentPath || [],
        });
      }
    } catch (err) {
      console.error('Failed to load delivery details:', err);
      setError(err.message || 'Failed to load delivery details');
      setDelivery(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deliveryId]);

  const handleSocketLocationUpdate = useCallback((payload) => {
    const normalized = transportService.normalizeLocationData(payload);

    setTracking((prev) => {
      const incomingLocation = normalized.currentLocation;
      const nextPath = [...(prev.recentPath || [])];

      if (incomingLocation) {
        nextPath.push(incomingLocation);
      }

      return {
        currentLocation: incomingLocation || prev.currentLocation,
        recentPath: nextPath.slice(-100),
      };
    });
  }, []);

  const handleSocketStatusUpdate = useCallback((payload) => {
    if (!payload?.status) return;

    setDelivery((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        status: payload.status,
        statusLabel: payload.status
          .toString()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase()),
      };
    });
  }, []);

  const syncLocation = useCallback(async (coords) => {
    if (!deliveryId || !coords) return;

    const payload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: new Date().toISOString(),
    };

    try {
      await transportService.updateDeliveryLocation(deliveryId, payload);
    } catch (err) {
      console.warn('HTTP location sync failed:', err.message);
    }

    try {
      if (socketService.isSocketConnected()) {
        await socketService.emitDeliveryLocation(deliveryId, payload);
      }
    } catch (err) {
      console.warn('Socket location sync failed:', err.message);
    }

    setTracking((prev) => ({
      currentLocation: payload,
      recentPath: [...(prev.recentPath || []), payload].slice(-100),
    }));
  }, [deliveryId]);

  const startLiveTracking = useCallback(async () => {
    if (!delivery || !canTrackStatus(delivery.status)) {
      Alert.alert('Tracking Not Available', 'Tracking can only start when delivery is active.');
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(permission.status);

      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow location access to enable live tracking.');
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await syncLocation(currentPosition.coords);

      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
          timeInterval: 10000,
        },
        async (position) => {
          await syncLocation(position.coords);
        }
      );

      setTrackingActive(true);
    } catch (err) {
      console.error('Failed to start live tracking:', err);
      Alert.alert('Tracking Error', err.message || 'Failed to start live tracking');
    }
  }, [delivery, syncLocation]);

  const refreshLatestLocation = useCallback(async () => {
    try {
      const response = await transportService.getDeliveryLocation(deliveryId);
      const normalized = transportService.normalizeLocationData(response.data || {});
      setTracking({
        currentLocation: normalized.currentLocation,
        recentPath: normalized.recentPath || [],
      });
    } catch (err) {
      console.warn('Location refresh failed:', err.message);
    }
  }, [deliveryId]);

  const openInMaps = () => {
    const location = tracking.currentLocation;
    if (!location?.latitude || !location?.longitude) {
      Alert.alert('No Location', 'No live location is available yet.');
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to Open Maps', 'Please check your map app availability.');
    });
  };

  const updateDeliveryStatus = (targetStatus) => {
    if (!delivery) return;

    const label = targetStatus === 'delivered' ? 'mark as delivered' : 'mark as completed';

    Alert.alert('Update Status', `Do you want to ${label}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            setUpdatingStatus(true);
            await transportService.updateDeliveryStatus(delivery.id, targetStatus);
            if (targetStatus === 'completed') {
              stopLiveTracking();
            }
            await loadDeliveryDetails(false);
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to update status');
          } finally {
            setUpdatingStatus(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (isFocused) {
      loadDeliveryDetails();
    }
  }, [isFocused, loadDeliveryDetails]);

  useEffect(() => {
    let mounted = true;

    const setupSocketTracking = async () => {
      if (!deliveryId) return;

      try {
        await socketService.connect();
        if (!mounted) return;

        socketHandlersRef.current = await socketService.subscribeToDeliveryTracking(
          deliveryId,
          handleSocketLocationUpdate,
          handleSocketStatusUpdate
        );
      } catch (err) {
        console.warn('Socket tracking setup failed:', err.message);
      }
    };

    setupSocketTracking();

    return () => {
      mounted = false;
      if (socketHandlersRef.current) {
        socketService.unsubscribeFromDeliveryTracking(deliveryId, socketHandlersRef.current);
        socketHandlersRef.current = null;
      }
    };
  }, [deliveryId, handleSocketLocationUpdate, handleSocketStatusUpdate]);

  useEffect(() => {
    if (!deliveryId) return;

    const poll = async () => {
      try {
        const response = await transportService.getDeliveryLocation(deliveryId);
        const normalized = transportService.normalizeLocationData(response.data || {});

        setTracking((prev) => ({
          currentLocation: normalized.currentLocation || prev.currentLocation,
          recentPath: normalized.recentPath?.length ? normalized.recentPath : prev.recentPath,
        }));
      } catch (err) {
        // Silent fallback; socket updates may still be active.
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 15000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [deliveryId]);

  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, [stopLiveTracking]);

  if (loading) {
    return <LoadingSpinner text="Loading delivery details..." />;
  }

  if (!delivery) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
        <Text style={styles.errorTitle}>{error || 'Delivery not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadDeliveryDetails()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const location = tracking.currentLocation;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDeliveryDetails(false);
          }}
          colors={['#1565C0']}
        />
      }
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderNumber}>#{delivery.orderNumber}</Text>
            <Text style={styles.cropName}>{delivery.cropName}</Text>
          </View>
          <StatusBadge status={delivery.statusLabel} size="small" />
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="inventory" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{delivery.quantity} {delivery.unit}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="payments" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatCurrency(delivery.totalAmount)}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialIcons name="event" size={16} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(delivery.scheduledDate || delivery.createdAt, 'datetime')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Route</Text>

        <View style={styles.routeItem}>
          <MaterialIcons name="radio-button-checked" size={16} color="#2E7D32" />
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeValue}>{delivery.pickupCity || 'N/A'}</Text>
            {delivery.pickupAddress ? <Text style={styles.routeSub}>{delivery.pickupAddress}</Text> : null}
          </View>
        </View>

        <View style={styles.routeDivider} />

        <View style={styles.routeItem}>
          <MaterialIcons name="location-on" size={16} color="#D32F2F" />
          <View style={styles.routeContent}>
            <Text style={styles.routeLabel}>Drop</Text>
            <Text style={styles.routeValue}>{delivery.deliveryCity || 'N/A'}</Text>
            {delivery.deliveryAddress ? <Text style={styles.routeSub}>{delivery.deliveryAddress}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live Tracking</Text>

        <View style={styles.locationStatsRow}>
          <View style={styles.locationStat}>
            <Text style={styles.locationLabel}>Latitude</Text>
            <Text style={styles.locationValue}>{formatCoordinate(location?.latitude)}</Text>
          </View>
          <View style={styles.locationStat}>
            <Text style={styles.locationLabel}>Longitude</Text>
            <Text style={styles.locationValue}>{formatCoordinate(location?.longitude)}</Text>
          </View>
        </View>

        <View style={styles.locationStatsRow}>
          <View style={styles.locationStat}>
            <Text style={styles.locationLabel}>Accuracy</Text>
            <Text style={styles.locationValue}>
              {typeof location?.accuracy === 'number' ? `${Math.round(location.accuracy)} m` : '--'}
            </Text>
          </View>
          <View style={styles.locationStat}>
            <Text style={styles.locationLabel}>Speed</Text>
            <Text style={styles.locationValue}>
              {typeof location?.speed === 'number' ? `${location.speed.toFixed(1)} m/s` : '--'}
            </Text>
          </View>
        </View>

        <Text style={styles.pathCount}>Recent points: {tracking.recentPath?.length || 0}</Text>
        <Text style={styles.pathCount}>Last update: {formatDate(location?.timestamp, 'datetime') || 'N/A'}</Text>

        {locationPermission === 'denied' ? (
          <Text style={styles.permissionWarning}>
            Location permission is denied. Enable location access to share live tracking.
          </Text>
        ) : null}

        <View style={styles.actionGrid}>
          {user?.role === 'transport' && canTrackStatus(delivery.status) ? (
            <TouchableOpacity
              style={[styles.primaryAction, trackingActive && styles.stopAction]}
              onPress={trackingActive ? stopLiveTracking : startLiveTracking}
            >
              <MaterialIcons
                name={trackingActive ? 'stop-circle' : 'my-location'}
                size={16}
                color={Colors.white}
              />
              <Text style={styles.primaryActionText}>
                {trackingActive ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.secondaryAction} onPress={refreshLatestLocation}>
            <MaterialIcons name="refresh" size={16} color="#1565C0" />
            <Text style={styles.secondaryActionText}>Refresh Location</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={openInMaps}>
            <MaterialIcons name="map" size={16} color="#1565C0" />
            <Text style={styles.secondaryActionText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contacts</Text>

        <View style={styles.contactRow}>
          <MaterialIcons name="person" size={16} color={Colors.textSecondary} />
          <Text style={styles.contactText}>Farmer: {delivery.farmer?.name || 'N/A'}</Text>
          {delivery.farmer?.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.farmer.phone}`)}>
              <MaterialIcons name="phone" size={18} color="#2E7D32" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.contactRow}>
          <MaterialIcons name="store" size={16} color={Colors.textSecondary} />
          <Text style={styles.contactText}>Trader: {delivery.trader?.name || 'N/A'}</Text>
          {delivery.trader?.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.trader.phone}`)}>
              <MaterialIcons name="phone" size={18} color="#2E7D32" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {user?.role === 'transport' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Actions</Text>
          {delivery.status === 'in_transit' ? (
            <TouchableOpacity
              style={[styles.primaryAction, updatingStatus && styles.disabledAction]}
              onPress={() => updateDeliveryStatus('delivered')}
              disabled={updatingStatus}
            >
              <Text style={styles.primaryActionText}>Mark Delivered</Text>
            </TouchableOpacity>
          ) : null}

          {delivery.status === 'delivered' ? (
            <TouchableOpacity
              style={[styles.primaryAction, styles.completeAction, updatingStatus && styles.disabledAction]}
              onPress={() => updateDeliveryStatus('completed')}
              disabled={updatingStatus}
            >
              <Text style={styles.primaryActionText}>Mark Completed</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: Colors.background },
  errorTitle: { marginTop: 10, fontSize: 16, fontWeight: '600', color: Colors.error, textAlign: 'center' },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  cropName: { marginTop: 3, fontSize: 18, fontWeight: '700', color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaText: { marginLeft: 8, color: Colors.textSecondary, fontSize: 13 },
  routeItem: { flexDirection: 'row', alignItems: 'flex-start' },
  routeContent: { marginLeft: 8, flex: 1 },
  routeLabel: { fontSize: 12, color: Colors.textSecondary },
  routeValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  routeSub: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
  routeDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  locationStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  locationStat: { width: '48%', backgroundColor: Colors.background, borderRadius: 8, padding: 10 },
  locationLabel: { fontSize: 11, color: Colors.textSecondary },
  locationValue: { marginTop: 2, fontSize: 14, fontWeight: '700', color: Colors.text },
  pathCount: { marginTop: 8, fontSize: 12, color: Colors.textSecondary },
  permissionWarning: { marginTop: 10, color: Colors.error, fontSize: 12 },
  actionGrid: { marginTop: 12 },
  primaryAction: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  stopAction: { backgroundColor: '#E65100' },
  completeAction: { backgroundColor: '#2E7D32' },
  disabledAction: { opacity: 0.7 },
  primaryActionText: { color: Colors.white, fontSize: 13, fontWeight: '700', marginLeft: 6 },
  secondaryAction: {
    borderWidth: 1,
    borderColor: '#1565C030',
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  secondaryActionText: { color: '#1565C0', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  contactText: { flex: 1, marginLeft: 8, color: Colors.text, fontSize: 13, fontWeight: '500' },
  retryBtn: { marginTop: 14, backgroundColor: '#1565C0', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: Colors.white, fontWeight: '700' },
});

export default DeliveryDetailScreen;
