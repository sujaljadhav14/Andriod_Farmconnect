import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class WeatherService {
  normalizeWeatherPayload(payload = {}) {
    const location = payload.location || {};
    const current = payload.current || {};
    const forecast = Array.isArray(payload.forecast) ? payload.forecast : [];

    return {
      location: {
        name: location.name || 'Current Location',
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone || 'auto',
      },
      current: {
        temperatureC: Number(current.temperatureC || 0),
        humidity: Number(current.humidity || 0),
        precipitationMm: Number(current.precipitationMm || 0),
        windSpeedKmh: Number(current.windSpeedKmh || 0),
        uvIndex: Number(current.uvIndex || 0),
        visibilityKm: Number(current.visibilityKm || 0),
        weatherCode: Number(current.weatherCode || 0),
        condition: current.condition || 'Weather Update',
        icon: current.icon || 'wb-sunny',
        isDay: current.isDay !== false,
        timestamp: current.timestamp || null,
      },
      forecast: forecast.map((day) => ({
        day: day.day || '',
        date: day.date || null,
        tempMaxC: Number(day.tempMaxC || 0),
        tempMinC: Number(day.tempMinC || 0),
        precipitationChance: Number(day.precipitationChance || 0),
        weatherCode: Number(day.weatherCode || 0),
        condition: day.condition || 'Weather Update',
        icon: day.icon || 'wb-sunny',
      })),
    };
  }

  async getWeather(params = {}) {
    const query = new URLSearchParams();

    if (params.latitude !== undefined && params.latitude !== null) {
      query.append('latitude', String(params.latitude));
    }
    if (params.longitude !== undefined && params.longitude !== null) {
      query.append('longitude', String(params.longitude));
    }
    if (params.city) {
      query.append('city', String(params.city));
    }
    if (params.state) {
      query.append('state', String(params.state));
    }

    const endpoint = query.toString()
      ? `${API_ENDPOINTS.WEATHER.GET_WEATHER}?${query.toString()}`
      : API_ENDPOINTS.WEATHER.GET_WEATHER;

    const response = await apiService.get(endpoint);
    return this.normalizeWeatherPayload(response?.data || response);
  }

  async getMyLocations() {
    const response = await apiService.get(API_ENDPOINTS.WEATHER.MY_LOCATIONS);
    return response?.data || [];
  }

  async getWeatherByLocationId(locationId) {
    const response = await apiService.get(API_ENDPOINTS.WEATHER.LOCATION(locationId));
    return this.normalizeWeatherPayload(response?.data || response);
  }
}

export default new WeatherService();
