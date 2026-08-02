import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

export default function Drawer({ open, onClose }) {
  const nav = useNavigate();
  const { lang } = useAppSettings();

  if (!open) return null;

  function go(path) {
    onClose();
    nav(path);
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          🚕 {t('app_name', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/home')}>
          🎫 {t('menu_queue_lada', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/coming-soon/menu_driver_gps')}>
          📍 {t('menu_driver_gps', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/report')}>
          👥 {t('menu_crowd_report', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/coming-soon/menu_photo_report')}>
          📷 {t('menu_photo_report', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/coming-soon/menu_maps')}>
          🗺️ {t('menu_maps', lang)}
        </div>
        <div className="drawer-item" onClick={() => go('/settings')}>
          ⚙️ {t('menu_settings', lang)}
        </div>
      </div>
    </div>
  );
}
