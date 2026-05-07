import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation, LANGUAGES } from '../i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('farmsense_lang') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('farmsense_lang', language);
        document.documentElement.lang = language;
    }, [language]);

    /**
     * Translate a dot-separated key path.
     * Usage: t('nav.home') → "Home" | "होम" | "होम"
     */
    const t = useCallback((keyPath) => {
        return getTranslation(language, keyPath);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
