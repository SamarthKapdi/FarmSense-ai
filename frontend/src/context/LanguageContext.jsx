import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('farmsense_lang') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('farmsense_lang', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        const langDict = translations[language] || translations.en;
        return langDict[key] || translations.en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
