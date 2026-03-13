import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { Colors } from './constants/colors';

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
