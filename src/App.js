import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { LanguageProvider } from './context/LanguageContext';
import AppNavigator from './navigation/AppNavigator';
import { Colors } from './constants/colors';

const App = () => {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </LanguageProvider>
  );
};

export default App;
