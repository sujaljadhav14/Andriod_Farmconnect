import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

import TraderDashboardScreen from '../screens/trader/TraderDashboardScreen';
import BrowseCropsScreen from '../screens/trader/BrowseCropsScreen';
import CropDetailScreen from '../screens/trader/CropDetailScreen';
import CreateProposalScreen from '../screens/trader/CreateProposalScreen';
import MyOrdersScreen from '../screens/trader/MyOrdersScreen';
import MyProposalsScreen from '../screens/trader/MyProposalsScreen';
import KYCScreen from '../screens/trader/KYCScreen';
import PaymentsScreen from '../screens/trader/PaymentsScreen';
import AnalyticsScreen from '../screens/trader/AnalyticsScreen';
import FarmerNetworkScreen from '../screens/trader/FarmerNetworkScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BrowseStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#E65100' },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen name="BrowseList" component={BrowseCropsScreen} options={{ title: 'Browse Crops' }} />
      <Stack.Screen name="CropDetail" component={CropDetailScreen} options={{ title: 'Crop Details' }} />
      <Stack.Screen name="CreateProposal" component={CreateProposalScreen} options={{ title: 'Make Proposal' }} />
    </Stack.Navigator>
  );
};

const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#E65100' },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Stack.Screen name="DashboardMain" component={TraderDashboardScreen} options={{ title: 'Trader Dashboard' }} />
      <Stack.Screen name="KYC" component={KYCScreen} options={{ title: 'KYC Verification' }} />
      <Stack.Screen name="BrowseCrops" component={BrowseCropsScreen} options={{ title: 'Browse Crops' }} />
      <Stack.Screen name="CropDetail" component={CropDetailScreen} options={{ title: 'Crop Details' }} />
      <Stack.Screen name="CreateProposal" component={CreateProposalScreen} options={{ title: 'Make Proposal' }} />
      <Stack.Screen name="MyProposals" component={MyProposalsScreen} options={{ title: 'My Proposals' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Market Analytics' }} />
      <Stack.Screen name="FarmerNetwork" component={FarmerNetworkScreen} options={{ title: 'Farmer Network' }} />
    </Stack.Navigator>
  );
};

const TraderNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E65100',
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
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseStack}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          headerShown: true,
          headerTitle: 'My Orders',
          headerStyle: { backgroundColor: '#E65100' },
          headerTintColor: Colors.white,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Proposals"
        component={MyProposalsScreen}
        options={{
          tabBarLabel: 'Proposals',
          headerShown: true,
          headerTitle: 'My Proposals',
          headerStyle: { backgroundColor: '#E65100' },
          headerTintColor: Colors.white,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TraderNavigator;
