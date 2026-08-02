import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createLadaSocket, joinLadaPool } from '../services/socket';
import { getSavedUser } from '../services/storage';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function LadaStatus() {
  const location = useLocation();
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const { stationId, destinationId, stationName, destinationName } = location.state || {};
  const [count, setCount] = useState(0);
  const [maxSize, setMaxSize] = useState(4);
  const [members, setMembers] = useState(null);
  const socketRef = useRef(null);
  const user = getSavedUser();

  useEffect(() => {
    if (!stationId || !destinationId || !user) {
      nav('/home');
      return;
    }

    const socket = createLadaSocket();
    socketRef.current = socket;

    socket.on('lada:pool_update', (data) => {
      setCount(data.count);
      setMaxSize(data.maxSize);
    });

    socket.on('lada:ready', (data) => {
      setMembers(data.members);
    });

    joinLadaPool(socket, { userId: user.id, stationId, destinationId });

    return () => socket.disconnect();
  }, []);

  if (!stationId) return null;

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t('lada_matching', lang)}
      </div>
      <div className="screen-body">
        <p className="subtitle" style={{ textAlign: 'center' }}>
          {stationName} → {destinationName}
        </p>

        {members ? (
          <>
            <div className="center-column" style={{ minHeight: 'auto', paddingBottom: 8 }}>
              <div style={{ fontSize: 48 }}>👥</div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{t('lada_full', lang)}</h2>
            </div>
            {members.map((m) => (
              <div className="member-row" key={m.id}>
                <div className="avatar" style={{ background: m.id === user.id ? '#888' : 'var(--primary)' }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.phone}</div>
                </div>
                {m.id === user.id ? (
                  <span className="chip selected" style={{ margin: 0 }}>{t('you_label', lang)}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`tel:${m.phone}`} title={t('call', lang)} style={{ fontSize: 20, textDecoration: 'none' }}>📞</a>
                    <a href={`sms:${m.phone}`} title={t('text', lang)} style={{ fontSize: 20, textDecoration: 'none' }}>💬</a>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, textAlign: 'center' }}>
              {t('waiting_riders', lang)} ({count}/{maxSize})
            </h2>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(count / maxSize) * 100}%` }} />
            </div>
            <p className="subtitle">⚡ {t('live_hint', lang)}</p>
          </>
        )}
      </div>
    </div>
  );
}
