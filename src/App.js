import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { AppProvider } from './context/AppProvider';
import AppNavigator from './navigation/AppNavigator';
import Colors from './constants/colors';

const App = () => {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </AppProvider>
  );
};

export default App;
