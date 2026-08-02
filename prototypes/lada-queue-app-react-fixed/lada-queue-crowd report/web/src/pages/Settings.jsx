import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function Settings() {
  const nav = useNavigate();
  const { theme, setTheme, lang, setLang } = useAppSettings();

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t('menu_settings', lang)}
      </div>
      <div className="screen-body">
        <h2 className="title">{t('theme_section', lang)}</h2>
        <label className="radio-row">
          <input type="radio" checked={theme === 'light'} onChange={() => setTheme('light')} />
          {t('light', lang)}
        </label>
        <label className="radio-row">
          <input type="radio" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
          {t('dark', lang)}
        </label>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        <h2 className="title">{t('language_section', lang)}</h2>
        <label className="radio-row">
          <input type="radio" checked={lang === 'en'} onChange={() => setLang('en')} />
          English
        </label>
        <label className="radio-row">
          <input type="radio" checked={lang === 'am'} onChange={() => setLang('am')} />
          አማርኛ (Amharic)
        </label>
      </div>
    </div>
  );
}
