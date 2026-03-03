import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const forecast = [
  { day: 'Today', temp: '32\u00B0', low: '22\u00B0', icon: 'wb-sunny', condition: 'Sunny', rain: '0%' },
  { day: 'Tomorrow', temp: '30\u00B0', low: '21\u00B0', icon: 'cloud', condition: 'Cloudy', rain: '20%' },
  { day: 'Wed', temp: '28\u00B0', low: '20\u00B0', icon: 'grain', condition: 'Light Rain', rain: '60%' },
  { day: 'Thu', temp: '29\u00B0', low: '21\u00B0', icon: 'wb-cloudy', condition: 'Partly Cloudy', rain: '10%' },
  { day: 'Fri', temp: '31\u00B0', low: '22\u00B0', icon: 'wb-sunny', condition: 'Sunny', rain: '0%' },
];

const WeatherScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.currentWeather}>
        <MaterialIcons name="wb-sunny" size={64} color="#FFC107" />
        <Text style={styles.currentTemp}>32\u00B0C</Text>
        <Text style={styles.currentCondition}>Sunny</Text>
        <Text style={styles.location}>Pune, Maharashtra</Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailCard}>
          <MaterialIcons name="water-drop" size={24} color="#1565C0" />
          <Text style={styles.detailValue}>45%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="air" size={24} color="#757575" />
          <Text style={styles.detailValue}>12 km/h</Text>
          <Text style={styles.detailLabel}>Wind</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="wb-twilight" size={24} color="#E65100" />
          <Text style={styles.detailValue}>5</Text>
          <Text style={styles.detailLabel}>UV Index</Text>
        </View>
        <View style={styles.detailCard}>
          <MaterialIcons name="visibility" size={24} color="#2E7D32" />
          <Text style={styles.detailValue}>10 km</Text>
          <Text style={styles.detailLabel}>Visibility</Text>
        </View>
      </View>

      <View style={styles.forecastSection}>
        <Text style={styles.sectionTitle}>5-Day Forecast</Text>
        {forecast.map((day, index) => (
          <View key={index} style={styles.forecastRow}>
            <Text style={styles.forecastDay}>{day.day}</Text>
            <MaterialIcons name={day.icon} size={24} color="#FFC107" />
            <Text style={styles.forecastCondition}>{day.condition}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>{day.temp}</Text>
              <Text style={styles.forecastLow}>{day.low}</Text>
            </View>
            <View style={styles.rainChance}>
              <MaterialIcons name="water-drop" size={14} color="#1565C0" />
              <Text style={styles.rainText}>{day.rain}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.alertCard}>
        <MaterialIcons name="warning" size={24} color="#E65100" />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Weather Advisory</Text>
          <Text style={styles.alertText}>
            Light rain expected on Wednesday. Consider harvesting tomatoes before then.
          </Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
});

export default WeatherScreen;
