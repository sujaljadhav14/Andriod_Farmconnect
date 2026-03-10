import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

import FarmerDashboardScreen from '../screens/farmer/FarmerDashboardScreen';
import MyCropsScreen from '../screens/farmer/MyCropsScreen';
import AddCropScreen from '../screens/farmer/AddCropScreen';
import MyOrdersScreen from '../screens/farmer/MyOrdersScreen';
import WeatherScreen from '../screens/farmer/WeatherScreen';
import BankDetailsScreen from '../screens/farmer/BankDetailsScreen';
import MarketPricesScreen from '../screens/farmer/MarketPricesScreen';
import KYCScreen from '../screens/farmer/KYCScreen';
import CommunityScreen from '../screens/farmer/CommunityScreen';
import CalendarScreen from '../screens/farmer/CalendarScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const FarmerHomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen name="Dashboard" component={FarmerDashboardScreen} options={{ title: 'Farmer Dashboard' }} />
      <Stack.Screen name="AddCrop" component={AddCropScreen} options={{ title: 'Add New Crop' }} />
      <Stack.Screen name="MyCrops" component={MyCropsScreen} options={{ title: 'My Crops' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Weather' }} />
      <Stack.Screen name="MarketPrices" component={MarketPricesScreen} options={{ title: 'Market Prices' }} />
      <Stack.Screen name="BankDetails" component={BankDetailsScreen} options={{ title: 'Bank Details' }} />
      <Stack.Screen name="KYC" component={KYCScreen} options={{ title: 'KYC Verification' }} />
      <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Farm Calendar' }} />
    </Stack.Navigator>
  );
};

const CropsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen name="MyCropsList" component={MyCropsScreen} options={{ title: 'My Crops' }} />
      <Stack.Screen name="AddCropFromList" component={AddCropScreen} options={{ title: 'Add New Crop' }} />
    </Stack.Navigator>
  );
};

const FarmerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={FarmerHomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Crops"
        component={CropsStack}
        options={{
          tabBarLabel: 'My Crops',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="grass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          headerShown: true,
          headerTitle: 'My Orders',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          tabBarLabel: 'Weather',
          headerShown: true,
          headerTitle: 'Weather',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="wb-sunny" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default FarmerNavigator;
