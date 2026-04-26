import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../translations/en.json';
import hi from '../translations/hi.json';
import mr from '../translations/mr.json';
import storageService from '../services/storageService';

const LanguageContext = createContext();

const translations = {
    en,
    hi,
    mr,
};

const DEFAULT_LANGUAGE = 'en';
const AVAILABLE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'mr', label: 'Marathi' },
];

const isSupportedLanguage = (languageCode) => AVAILABLE_LANGUAGES.some((item) => item.code === languageCode);

const getDeviceLanguage = () => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || DEFAULT_LANGUAGE;
    const normalized = locale.toLowerCase().split('-')[0];
    return isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
};

const getNestedValue = (source, keys) => {
    let value = source;

    for (const key of keys) {
        value = value?.[key];
        if (value === undefined) {
            return undefined;
        }
    }

    return value;
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
    const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await storageService.getLanguage();
            const resolvedLanguage = isSupportedLanguage(savedLanguage) ? savedLanguage : getDeviceLanguage();
            setLanguage(resolvedLanguage);
        } catch (error) {
            console.error('Error loading language:', error);
            setLanguage(getDeviceLanguage());
        }
    };

    const changeLanguage = async (lang) => {
        if (!isSupportedLanguage(lang)) {
            return;
        }

        try {
            await storageService.saveLanguage(lang);
            setLanguage(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key, params = {}) => {
        const keys = key.split('.');
        const localizedValue = getNestedValue(translations[language] ?? translations[DEFAULT_LANGUAGE], keys);
        const fallbackValue = getNestedValue(translations[DEFAULT_LANGUAGE], keys);
        const value = localizedValue ?? fallbackValue;

        if (value === undefined) {
            return key;
        }

        return interpolate(value, params) || key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                changeLanguage,
                availableLanguages: AVAILABLE_LANGUAGES,
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

