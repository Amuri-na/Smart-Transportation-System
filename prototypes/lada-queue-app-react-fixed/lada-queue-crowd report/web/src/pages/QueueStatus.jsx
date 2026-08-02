import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQueueStatus, confirmQueueEntry, cancelQueueEntry } from '../services/api';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function QueueStatus() {
  const { entryId } = useParams();
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const [status, setStatus] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  async function fetchStatus() {
    const data = await getQueueStatus(entryId);
    setStatus(data);
  }

  async function handleConfirm() {
    await confirmQueueEntry(entryId);
    fetchStatus();
  }

  async function handleCancel() {
    await cancelQueueEntry(entryId);
    nav('/home');
  }

  if (!status) return <div className="center-column">Loading...</div>;

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t('your_queue_spot', lang)}
      </div>
      <div className="center-column">
        {status.status === 'waiting' && (
          <>
            <div className="badge-circle">
              <div className="num">#{status.position}</div>
              <div style={{ color: 'var(--text-muted)' }}>{t('in_line', lang)}</div>
            </div>
            <p className="subtitle">🚕 {t('taxi_arrives', lang)}{status.nextTaxiEtaMinutes} {t('min', lang)}</p>
            {status.physicalLineCount > 0 && (
              <p className="helper-text">
                🚶 {t('physical_line_label', lang)}: {status.physicalLineCount}
              </p>
            )}
            <button className="outline-btn" style={{ marginTop: 24, maxWidth: 220 }} onClick={handleCancel}>
              {t('cancel_spot', lang)}
            </button>
          </>
        )}

        {status.status === 'called' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🚖</div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{t('taxi_arrived', lang)}</h2>
            <p className="subtitle">{t('check_in_warning', lang)}</p>
            <button className="primary-btn" style={{ marginTop: 16, maxWidth: 260 }} onClick={handleConfirm}>
              {t('check_in_btn', lang)}
            </button>
          </>
        )}

        {status.status === 'confirmed' && (
          <>
            <div style={{ fontSize: 48, color: '#2e7d32', marginBottom: 8 }}>✅</div>
            <h2 style={{ fontSize: 20 }}>{t('checked_in', lang)}</h2>
          </>
        )}

        {status.status === 'expired' && (
          <>
            <div style={{ fontSize: 48, color: '#e53935', marginBottom: 8 }}>❌</div>
            <p style={{ fontSize: 18 }}>{t('missed_turn', lang)}</p>
            <button className="primary-btn" style={{ marginTop: 20, maxWidth: 220 }} onClick={() => nav('/home')}>
              {t('back_home', lang)}
            </button>
          </>
        )}

        {status.status === 'cancelled' && <p style={{ fontSize: 18 }}>{t('entry_cancelled', lang)}</p>}
      </div>
    </div>
  );
}
