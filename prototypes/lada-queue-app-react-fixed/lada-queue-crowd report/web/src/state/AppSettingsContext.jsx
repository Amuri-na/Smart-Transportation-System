import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSavedSettings, saveSettings } from '../services/storage';

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const initial = getSavedSettings();
  const [theme, setThemeState] = useState(initial.theme || 'dark');
  const [lang, setLangState] = useState(initial.lang || 'en');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(next) {
    setThemeState(next);
    saveSettings({ theme: next, lang });
  }

  function setLang(next) {
    setLangState(next);
    saveSettings({ theme, lang: next });
  }

  return (
    <AppSettingsContext.Provider value={{ theme, setTheme, lang, setLang }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
