import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

const dictionaries = { en, hi, ta };
const LANGUAGE_KEY = 'agritech_language';

const getByPath = (object, path) =>
  path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), object);

const LanguageContext = createContext(null);

/**
 * Multilingual provider with dot-notation lookup, English fallback and persistence.
 */
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return dictionaries[saved] ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key, vars) => {
      let value = getByPath(dictionaries[language], key);
      if (value === undefined) value = getByPath(en, key);
      if (typeof value !== 'string') return key;
      if (vars) {
        Object.entries(vars).forEach(([token, replacement]) => {
          value = value.replace(new RegExp(`\\{${token}\\}`, 'g'), replacement);
        });
      }
      return value;
    },
    [language]
  );

  const languages = useMemo(
    () => [
      { code: 'en', label: 'English' },
      { code: 'hi', label: 'हिन्दी' },
      { code: 'ta', label: 'தமிழ்' }
    ],
    []
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languages }),
    [language, t, languages]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
