import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function ComingSoon() {
  const { titleKey } = useParams();
  const nav = useNavigate();
  const { lang } = useAppSettings();

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t(titleKey, lang)}
      </div>
      <div className="center-column">
        <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>🛠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>{t('coming_soon', lang)}</h2>
        <p className="subtitle">{t('coming_soon_msg', lang)}</p>
      </div>
    </div>
  );
}
