import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// Import the new transport screens
import {
  TransportBooking,
  TrackingScreen,
  DriverDetails
} from '../transport';

// Keep existing screens for other tabs
import TransportDashboardScreen from '../screens/transport/TransportDashboardScreen';
import AvailableOrdersScreen from '../screens/transport/AvailableOrdersScreen';
import MyDeliveriesScreen from '../screens/transport/MyDeliveriesScreen';
import VehicleManagementScreen from '../screens/transport/VehicleManagementScreen';
import DeliveryDetailScreen from '../screens/transport/DeliveryDetailScreen';
import TransportKYCScreen from '../screens/transport/TransportKYCScreen';
import DeliveryHistoryScreen from '../screens/transport/DeliveryHistoryScreen';
import RoutePlanningScreen from '../screens/transport/RoutePlanningScreen';
import TransportEarningsScreen from '../screens/transport/TransportEarningsScreen';
import ScheduleManagementScreen from '../screens/transport/ScheduleManagementScreen';
import TransportSupportScreen from '../screens/transport/TransportSupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1565C0' },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen
        name="DashboardMain"
        component={TransportDashboardScreen}
        options={{ title: 'Transport Dashboard' }}
      />
      <Stack.Screen
        name="AvailableOrders"
        component={AvailableOrdersScreen}
        options={{ title: 'Available Orders' }}
      />
      <Stack.Screen
        name="MyDeliveries"
        component={MyDeliveriesScreen}
        options={{ title: 'My Deliveries' }}
      />
      <Stack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen
        name="Vehicles"
        component={VehicleManagementScreen}
        options={{ title: 'My Vehicles' }}
      />
      <Stack.Screen
        name="TransportBooking"
        component={TransportBooking}
        options={{ title: 'Book Transport' }}
      />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ title: 'Live Tracking' }}
      />
      <Stack.Screen
        name="DriverDetails"
        component={DriverDetails}
        options={{ title: 'Driver Profile' }}
      />
      <Stack.Screen
        name="KYC"
        component={TransportKYCScreen}
        options={{ title: 'KYC Verification' }}
      />
      <Stack.Screen
        name="DeliveryHistory"
        component={DeliveryHistoryScreen}
        options={{ title: 'Delivery History' }}
      />
      <Stack.Screen
        name="RoutePlanning"
        component={RoutePlanningScreen}
        options={{ title: 'Route Planning' }}
      />
      <Stack.Screen
        name="Earnings"
        component={TransportEarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleManagementScreen}
        options={{ title: 'Schedule Management' }}
      />
      <Stack.Screen
        name="Support"
        component={TransportSupportScreen}
        options={{ title: 'Support' }}
      />
    </Stack.Navigator>
  );
};

const TransportNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: Colors.textSecondary,
        headerStyle: { backgroundColor: '#1565C0' },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
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
        name="Dashboard"
        component={DashboardStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Available"
        component={AvailableOrdersScreen}
        options={{
          tabBarLabel: 'Available',
          headerTitle: 'Available Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="local-shipping" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={MyDeliveriesScreen}
        options={{
          tabBarLabel: 'Deliveries',
          headerTitle: 'My Deliveries',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="delivery-dining" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehicleManagementScreen}
        options={{
          tabBarLabel: 'Vehicles',
          headerTitle: 'My Vehicles',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-car" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TransportNavigator;
