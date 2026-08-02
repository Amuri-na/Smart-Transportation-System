import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations, joinQueue, getNearestStation } from '../services/api';
import { getSavedUser } from '../services/storage';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';
import Drawer from '../components/Drawer';

export default function Home() {
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const [user, setUser] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // How the starting station got picked: 'detected' (from GPS), 'random'
  // (no location access — prototype fallback), or null while we're still
  // figuring it out. Purely informational, shown as a small hint to the
  // user.
  const [stationPickMode, setStationPickMode] = useState(null);
  const [destinationSearch, setDestinationSearch] = useState('');

  // Prevents the async location lookup from stomping on a station the
  // user already tapped by hand while we were still waiting on GPS.
  const manuallyPickedRef = useRef(false);

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved) {
      nav('/');
      return;
    }
    setUser(saved);
    loadStations();
  }, []);

  async function loadStations() {
    try {
      const data = await getStations();
      setStations(data);
      autoPickStation(data);
    } finally {
      setLoading(false);
    }
  }

  // Tries to detect the user's nearest station via GPS. If location isn't
  // available/granted, or the lookup fails for any reason, falls back to
  // randomly assigning a starting station — this is a prototype, so there's
  // no reason to block someone who hasn't granted location access.
  function autoPickStation(stationList) {
    if (!stationList.length) return;

    if (!navigator.geolocation) {
      pickRandomStation(stationList);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (manuallyPickedRef.current) return;
        try {
          const match = await getNearestStation(pos.coords.latitude, pos.coords.longitude);
          const found = stationList.find((s) => s.id === match.station.id);
          if (manuallyPickedRef.current) return;
          if (found) {
            setSelectedStation(found);
            setStationPickMode('detected');
          } else {
            pickRandomStation(stationList);
          }
        } catch (err) {
          if (!manuallyPickedRef.current) pickRandomStation(stationList);
        }
      },
      () => {
        if (!manuallyPickedRef.current) pickRandomStation(stationList);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function pickRandomStation(stationList) {
    const random = stationList[Math.floor(Math.random() * stationList.length)];
    setSelectedStation(random);
    setStationPickMode('random');
  }

  function selectStation(station) {
    manuallyPickedRef.current = true;
    setStationPickMode(null);
    setSelectedStation(station);
    setSelectedDestination(null);
    setDestinationSearch('');
  }

  async function handleJoinQueue() {
    const entry = await joinQueue({
      userId: user.id,
      stationId: selectedStation.id,
      destinationId: selectedDestination.id,
    });
    nav(`/queue/${entry.id}`);
  }

  function handleFindLada() {
    nav('/lada', {
      state: {
        stationId: selectedStation.id,
        destinationId: selectedDestination.id,
        stationName: selectedStation.name,
        destinationName: selectedDestination.name,
      },
    });
  }

  if (loading || !user) {
    return <div className="center-column">Loading...</div>;
  }

  const canProceed = selectedStation && selectedDestination;

  const filteredDestinations = selectedStation
    ? selectedStation.destinations.filter((d) =>
        d.name.toLowerCase().includes(destinationSearch.trim().toLowerCase())
      )
    : [];

  return (
    <div>
      <div className="app-bar">
        <button className="menu-btn" onClick={() => setDrawerOpen(true)}>☰</button>
        <span style={{ flex: 1 }}>🚕 {t('hi', lang)}, {user.name.split(' ')[0]}</span>
        {user.points > 0 && (
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
            🏅 {user.points} {t('points_label', lang)}
          </span>
        )}
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="screen-body">
        <h2 className="title">{t('pick_station', lang)}</h2>
        <p className="subtitle">{t('pick_station_sub', lang)}</p>

        {stationPickMode === 'detected' && selectedStation && (
          <p className="helper-text">
            📍 {t('station_auto_detected', lang).replace('{name}', selectedStation.name)}
          </p>
        )}
        {stationPickMode === 'random' && selectedStation && (
          <p className="helper-text">
            🎲 {t('station_auto_random', lang).replace('{name}', selectedStation.name)}
          </p>
        )}

        {stations.map((s) => (
          <div
            key={s.id}
            className={`card ${selectedStation?.id === s.id ? 'selected' : ''}`}
            onClick={() => selectStation(s)}
          >
            <div className="icon-circle">📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('next_taxi', lang)}{s.nextTaxiEtaMinutes} {t('min', lang)}
                {s.physicalLineCount > 0 && ` · 🚶 ${s.physicalLineCount} ${t('physical_line_label', lang)}`}
              </div>
            </div>
            {selectedStation?.id === s.id && <span>✅</span>}
          </div>
        ))}

        {selectedStation && (
          <>
            <h2 className="title" style={{ marginTop: 20 }}>{t('pick_destination', lang)}</h2>

            {selectedDestination ? (
              <div
                className="card selected"
                style={{ marginBottom: 20, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDestination(null);
                  setDestinationSearch('');
                }}
              >
                <div className="icon-circle">📍</div>
                <div style={{ flex: 1, fontWeight: 700 }}>{selectedDestination.name}</div>
                <span style={{ fontSize: 13, color: 'var(--primary)' }}>✅ {t('change_btn', lang)}</span>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={t('search_destination_placeholder', lang)}
                  value={destinationSearch}
                  onChange={(e) => setDestinationSearch(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ marginBottom: 20 }}>
                  {filteredDestinations.length === 0 && (
                    <p className="helper-text">{t('no_destination_match', lang)}</p>
                  )}
                  {filteredDestinations.map((d) => (
                    <span
                      key={d.id}
                      className="chip"
                      onClick={() => {
                        setSelectedDestination(d);
                        setDestinationSearch('');
                      }}
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <button className="primary-btn" style={{ marginBottom: 12 }} disabled={!canProceed} onClick={handleJoinQueue}>
          {t('join_queue', lang)}
        </button>
        <button className="outline-btn" disabled={!canProceed} onClick={handleFindLada}>
          {t('find_lada', lang)}
        </button>
      </div>
    </div>
  );
}
