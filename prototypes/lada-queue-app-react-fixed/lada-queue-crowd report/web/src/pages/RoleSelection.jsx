import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function RoleSelection() {
  const nav = useNavigate();
  const { lang } = useAppSettings();

  return (
    <div className="screen-body center-column">
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{t('welcome', lang)}</h1>
      <p className="subtitle" style={{ marginBottom: 32 }}>{t('role_question', lang)}</p>
      <button className="primary-btn" style={{ marginBottom: 12 }} onClick={() => nav('/details/passenger')}>
        {t('passenger', lang)}
      </button>
      <button className="outline-btn" onClick={() => nav('/details/driver')}>
        {t('driver', lang)}
      </button>
    </div>
  );
}
