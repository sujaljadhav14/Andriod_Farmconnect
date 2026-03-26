import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../translations/en.json';
import hi from '../translations/hi.json';
import mr from '../translations/mr.json';

const LanguageContext = createContext();

const translations = {
    en,
    hi,
    mr,
};

const interpolate = (value, params = {}) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value.replace(/\{\{(\w+)\}\}/g, (_, token) => {
        const replacement = params[token];
        return replacement === undefined || replacement === null
            ? `{{${token}}}`
            : String(replacement);
    });
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const saved = await AsyncStorage.getItem('language');
            if (saved) {
                setLanguage(saved);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        }
    };

    const changeLanguage = async (lang) => {
        try {
            await AsyncStorage.setItem('language', lang);
            setLanguage(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language] ?? translations.en;

        for (const k of keys) {
            value = value?.[k];
            if (!value) {
                return key; // Return key if translation not found
            }
        }

        return interpolate(value, params) || key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                changeLanguage,
                t,
            }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

