/**
 * App Provider
 * Wraps all context providers together
 */

import React from 'react';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { LanguageProvider } from './LanguageContext';

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProvider;
