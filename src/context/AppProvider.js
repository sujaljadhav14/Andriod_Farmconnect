/**
 * App Provider
 * Wraps all context providers together
 */

import React from 'react';
import { AuthProvider } from './AuthContext';
import { LanguageProvider } from './LanguageContext';

export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </AuthProvider>
  );
};

export default AppProvider;
