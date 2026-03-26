import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import RolePickerScreen from '../screens/RolePickerScreen';
import FarmerNavigator from './FarmerNavigator';
import TraderNavigator from './TraderNavigator';
import TransportNavigator from './TransportNavigator';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

const AppNavigator = () => {
  const { isAuthenticated, initializing, user } = useAuth();

  // Show loading screen while checking auth state
  if (initializing) {
    return <LoadingScreen />;
  }

  // Determine initial route based on auth and user role
  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Auth';
    if (!user?.role) return 'RolePicker';

    switch (user.role) {
      case 'farmer':
        return 'FarmerMain';
      case 'trader':
        return 'TraderMain';
      case 'transport':
        return 'TransportMain';
      case 'admin':
        return 'AdminMain';
      default:
        return 'RolePicker';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // Auth screens
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        // App screens
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
