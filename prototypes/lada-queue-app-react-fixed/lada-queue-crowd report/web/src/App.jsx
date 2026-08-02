import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { getSavedUser } from './services/storage';
import { useAppSettings } from './state/AppSettingsContext';
import { t } from './services/translations';
import PhoneFrame from './components/PhoneFrame';

import RoleSelection from './pages/RoleSelection';
import UserInfo from './pages/UserInfo';
import Home from './pages/Home';
import QueueStatus from './pages/QueueStatus';
import LadaStatus from './pages/LadaStatus';
import Settings from './pages/Settings';
import CrowdReport from './pages/CrowdReport';
import ComingSoon from './pages/ComingSoon';

function StartupGate() {
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = getSavedUser();
    if (saved) {
      nav('/home', { replace: true });
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) {
    return (
      <div className="splash">
        <div style={{ fontSize: 48 }}>🚕</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{t('app_name', lang)}</div>
      </div>
    );
  }

  return <RoleSelection />;
}

export default function App() {
  return (
    <PhoneFrame>
      <Routes>
        <Route path="/" element={<StartupGate />} />
        <Route path="/details/:role" element={<UserInfo />} />
        <Route path="/home" element={<Home />} />
        <Route path="/queue/:entryId" element={<QueueStatus />} />
        <Route path="/lada" element={<LadaStatus />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/report" element={<CrowdReport />} />
        <Route path="/coming-soon/:titleKey" element={<ComingSoon />} />
      </Routes>
    </PhoneFrame>
  );
}
