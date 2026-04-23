import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import weatherService from '../../services/weatherService';

const buildAdvisory = (weather) => {
  const rainChance = weather?.forecast?.[0]?.precipitationChance || 0;
  const wind = weather?.current?.windSpeedKmh || 0;
  const uv = weather?.current?.uvIndex || 0;

  if (rainChance >= 60) {
    return 'High rain probability today. Plan harvest and transport before peak rain windows.';
  }
  if (wind >= 25) {
    return 'Strong winds expected. Secure crop coverings and check greenhouse support lines.';
  }
  if (uv >= 7) {
    return 'High UV conditions. Prefer irrigation and field work during early morning or evening.';
  }

  return 'Weather looks stable for regular farm operations today. Keep monitoring moisture levels.';
};

const formatTemperature = (value) => `${Math.round(Number(value || 0))}°C`;

const formatForecastTemperature = (value) => `${Math.round(Number(value || 0))}°`;

const WeatherScreen = () => {
  const isFocused = useIsFocused();
  const { user } = useAuth();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [locationCity, setLocationCity] = useState('');

  const getFarmerCoordinates = useCallback(async () => {
    try {
      // First try to use farmer's stored location
      if (user?.location?.city) {
        setLocationCity(user.location.city);
        return null; // Let weatherService use city lookup
      }

      // Fall back to device location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationCity('Pune'); // Default city
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!position?.coords) {
        setLocationCity('Pune');
        return null;
      }

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err) {
      console.warn('Location access failed:', err.message);
      setLocationCity('Pune');
      return null;
    }
  }, [user]);

  const loadWeather = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      // Use farmer's location city if available
      const coordinates = user?.location?.city
        ? { city: user.location.city }
        : await getFarmerCoordinates();

      const weatherPayload = await weatherService.getWeather(coordinates || { city: 'Pune' });
      setWeather(weatherPayload);
      
      // Update location display
      if (user?.location?.city && !locationCity) {
        setLocationCity(user.location.city);
      }
    } catch (loadError) {
      console.error('Weather load error:', loadError);
      setError(loadError.message || 'Failed to load weather updates');
      setWeather(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, getFarmerCoordinates, locationCity]);

  useEffect(() => {
    if (isFocused) {
      loadWeather();
    }
  }, [isFocused, loadWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeather(false);
  }, [loadWeather]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading weather updates...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="cloud-off" size={52} color={Colors.textSecondary} />
        <Text style={styles.errorTitle}>Weather unavailable</Text>
        <Text style={styles.errorText}>{error || 'Unable to fetch weather data right now.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadWeather()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const advisoryText = buildAdvisory(weather);
  const current = weather.current || {};
  const forecast = weather.forecast || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.currentWeather}>
        <MaterialIcons name={current.icon || 'wb-sunny'} size={64} color="#FFC107" />
        <Text style={styles.currentTemp}>{formatTemperature(current.temperatureC)}</Text>
        <Text style={styles.currentCondition}>{current.condition || 'Weather Update'}</Text>
        <Text style={styles.location}>{weather.location?.name || 'Current Location'}</Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailCard}>
          <MaterialIcons name="water-drop" size={24} color="#1565C0" />
          <Text style={styles.detailValue}>{current.humidity || 0}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="air" size={24} color="#757575" />
          <Text style={styles.detailValue}>{Math.round(current.windSpeedKmh || 0)} km/h</Text>
          <Text style={styles.detailLabel}>Wind</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="wb-twilight" size={24} color="#E65100" />
          <Text style={styles.detailValue}>{Math.round(current.uvIndex || 0)}</Text>
          <Text style={styles.detailLabel}>UV Index</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="visibility" size={24} color="#2E7D32" />
          <Text style={styles.detailValue}>{Math.round(current.visibilityKm || 0)} km</Text>
          <Text style={styles.detailLabel}>Visibility</Text>
        </View>
      </View>

      <View style={styles.forecastSection}>
        <Text style={styles.sectionTitle}>5-Day Forecast</Text>
        {forecast.map((day, index) => (
          <View key={index} style={styles.forecastRow}>
            <Text style={styles.forecastDay}>{day.day}</Text>
            <MaterialIcons name={day.icon || 'wb-sunny'} size={24} color="#FFC107" />
            <Text style={styles.forecastCondition}>{day.condition}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>{formatForecastTemperature(day.tempMaxC)}</Text>
              <Text style={styles.forecastLow}>{formatForecastTemperature(day.tempMinC)}</Text>
            </View>
            <View style={styles.rainChance}>
              <MaterialIcons name="water-drop" size={14} color="#1565C0" />
              <Text style={styles.rainText}>{Math.round(day.precipitationChance || 0)}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.alertCard}>
        <MaterialIcons name="warning" size={24} color="#E65100" />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Weather Advisory</Text>
          <Text style={styles.alertText}>{advisoryText}</Text>
        </View>
      </View>

      {!!error && (
        <View style={styles.inlineErrorCard}>
          <MaterialIcons name="error-outline" size={18} color={Colors.error} />
          <Text style={styles.inlineErrorText}>{error}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  currentWeather: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  currentCondition: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  detailCard: {
    width: '46%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: '2%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  forecastSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  forecastDay: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  forecastCondition: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  forecastTemps: {
    flexDirection: 'row',
    marginRight: 12,
  },
  forecastHigh: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  forecastLow: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  rainChance: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  rainText: {
    fontSize: 12,
    color: '#1565C0',
    marginLeft: 2,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  inlineErrorCard: {
    marginHorizontal: 16,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
  },
  inlineErrorText: {
    marginLeft: 8,
    fontSize: 12,
    color: Colors.error,
    flex: 1,
  },
});

export default WeatherScreen;
