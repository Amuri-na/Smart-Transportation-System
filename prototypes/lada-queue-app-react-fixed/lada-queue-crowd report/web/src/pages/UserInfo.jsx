import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { registerUser } from '../services/api';
import { saveUser } from '../services/storage';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

// +251 then 9XXXXXXXX (Ethio Telecom) or 7XXXXXXXX (Safaricom Ethiopia)
const ET_PHONE_REGEX = /^\+251[79]\d{8}$/;

export default function UserInfo() {
  const { role } = useParams();
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+251');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setError('Please enter both name and phone number.');
      return;
    }
    if (!ET_PHONE_REGEX.test(trimmedPhone)) {
      setError('Enter a valid Ethiopian number, e.g. +251911234567 or +251711234567.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await registerUser({ role, name: trimmedName, phone: trimmedPhone });
      saveUser(user);
      nav('/home');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t('details_title', lang)}
      </div>
      <div className="screen-body">
        <p className="subtitle">{t('signing_up_as', lang)} {role}</p>

        <label className="field-label">{t('full_name', lang)}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">{t('phone_number', lang)}</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251911234567" />
        <div className="helper-text">{t('phone_helper', lang)}</div>

        {error && <div className="error-text">{error}</div>}

        <div style={{ marginTop: 24 }}>
          <button className="primary-btn" disabled={loading} onClick={submit}>
            {loading ? '...' : t('continue_btn', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
