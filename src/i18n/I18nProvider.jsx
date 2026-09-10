import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, isSupportedLanguage, LANGUAGE_STORAGE_KEY } from './languageConfig.js';
import { translations } from './translations.js';

export const I18nContext = createContext(null);

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function resolveTranslation(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

export default function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = useCallback(nextLanguage => {
    const next = isSupportedLanguage(nextLanguage) ? nextLanguage : DEFAULT_LANGUAGE;
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Continue with in-memory language state when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Persistence is optional and must not affect application startup.
    }
  }, [language]);

  const t = useCallback(path => {
    const localized = resolveTranslation(translations[language], path);
    if (localized !== undefined) return localized;
    return resolveTranslation(translations[DEFAULT_LANGUAGE], path) ?? path;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
