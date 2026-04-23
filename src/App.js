import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { AppProvider } from './context/AppProvider';
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { Colors } from './constants/colors';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

const AppContent = () => {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingSpinner visible={true} text="Initializing..." />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
     {isAuthenticated ? (
  <AppNavigator key={String(isAuthenticated)} />
) : (
  <AuthNavigator key={String(isAuthenticated)} />
)}
      <Toast />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
