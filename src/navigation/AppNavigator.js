import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RolePickerScreen from '../screens/RolePickerScreen';
import FarmerNavigator from './FarmerNavigator';
import TraderNavigator from './TraderNavigator';
import TransportNavigator from './TransportNavigator';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="RolePicker" component={RolePickerScreen} />
      <Stack.Screen name="FarmerMain" component={FarmerNavigator} />
      <Stack.Screen name="TraderMain" component={TraderNavigator} />
      <Stack.Screen name="TransportMain" component={TransportNavigator} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
