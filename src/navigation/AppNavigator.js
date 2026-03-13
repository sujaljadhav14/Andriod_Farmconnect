import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import RolePickerScreen from '../screens/RolePickerScreen';
import FarmerNavigator from './FarmerNavigator';
import TraderNavigator from './TraderNavigator';
import TransportNavigator from './TransportNavigator';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? 'RolePicker' : 'Auth'}
      screenOptions={{
        headerShown: false,
      }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="RolePicker" component={RolePickerScreen} />
          <Stack.Screen name="FarmerMain" component={FarmerNavigator} />
          <Stack.Screen name="TraderMain" component={TraderNavigator} />
          <Stack.Screen name="TransportMain" component={TransportNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
