import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import FarmerNavigator from './FarmerNavigator';
import TraderNavigator from './TraderNavigator';
import TransportNavigator from './TransportNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();

  // 🔥 RETURN BASED ON ROLE (NOT initialRoute)
  if (role === 'trader') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TraderMain" component={TraderNavigator} />
      </Stack.Navigator>
    );
  }

  if (role === 'transport') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TransportMain" component={TransportNavigator} />
      </Stack.Navigator>
    );
  }

  if (role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminMain" component={AdminNavigator} />
      </Stack.Navigator>
    );
  }

  // default farmer
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FarmerMain" component={FarmerNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;