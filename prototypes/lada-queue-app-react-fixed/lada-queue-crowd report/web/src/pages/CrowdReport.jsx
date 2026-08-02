import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitCrowdReport, getNearestStation, analyzeCrowdMedia } from '../services/api';
import { getSavedUser, saveUser } from '../services/storage';
import { t } from '../services/translations';
import { useAppSettings } from '../state/AppSettingsContext';

const MAX_VIDEO_SECONDS = 20;

export default function CrowdReport() {
  const nav = useNavigate();
  const { lang } = useAppSettings();
  const [user, setUser] = useState(null);

  // Location state: 'locating' | 'granted' | 'denied' | 'error'
  const [locationStatus, setLocationStatus] = useState('locating');
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [nearest, setNearest] = useState(null); // { station, distanceMeters, withinRange }

  const [reportMode, setReportMode] = useState('media'); // 'media' | 'text'
  const [peopleCount, setPeopleCount] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { pointsAwarded, totalPoints, station }

  // AI person-count preview, run automatically as soon as a photo/video is
  // picked (see analyzeSelectedFile below).
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { peopleCount, confidence, note }

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved) {
      nav('/');
      return;
    }
    setUser(saved);
    locateMe();
  }, []);

  function locateMe() {
    setLocationStatus('locating');
    setError(null);
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const match = await getNearestStation(lat, lng);
          setNearest(match);
          setLocationStatus('granted');
        } catch (err) {
          setLocationStatus('error');
        }
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function acceptFile(f) {
    setError(null);
    const video = f.type.startsWith('video/');
    if (video) {
      const url = URL.createObjectURL(f);
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        if (probe.duration > MAX_VIDEO_SECONDS + 0.5) {
          setError(t('video_too_long', lang));
          URL.revokeObjectURL(url);
        } else {
          setFile(f);
          setIsVideo(true);
          setPreviewUrl(url);
          analyzeSelectedFile(f);
        }
      };
      probe.src = url;
    } else {
      setFile(f);
      setIsVideo(false);
      setPreviewUrl(URL.createObjectURL(f));
      analyzeSelectedFile(f);
    }
  }

  // Sends the just-picked photo/video to the AI so it can tell the
  // passenger roughly how many people it sees. This is a live preview —
  // it never blocks selecting/submitting the report, and if it fails or
  // isn't configured on the server, the manual count still works fine.
  async function analyzeSelectedFile(f) {
    setAiResult(null);
    setAiAnalyzing(true);
    try {
      const analysis = await analyzeCrowdMedia(f);
      setAiResult(analysis);
      // If the passenger hasn't typed a count yet, prefill it with the
      // AI's estimate — they can still edit it before submitting.
      if (analysis && Number.isFinite(analysis.peopleCount) && !peopleCount) {
        setPeopleCount(String(analysis.peopleCount));
      }
    } catch (err) {
      setAiResult({ peopleCount: null, note: err.message || 'AI analysis failed.' });
    } finally {
      setAiAnalyzing(false);
    }
  }

  function handlePhotoChange(e) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  function handleVideoChange(e) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  }

  async function handleSubmit() {
    if (!coords || !nearest?.withinRange || !peopleCount) {
      setError(t('media_required', lang));
      return;
    }
    if (reportMode === 'media' && !file) {
      setError(t('media_required', lang));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('lat', coords.lat);
      formData.append('lng', coords.lng);
      formData.append('reporterUserId', user.id);
      formData.append('peopleCount', peopleCount);
      if (reportMode === 'media' && file) {
        formData.append('media', file);
      }

      const data = await submitCrowdReport(formData);
      const updatedUser = { ...user, points: data.totalPoints };
      saveUser(updatedUser);
      setUser(updatedUser);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  if (result) {
    return (
      <div>
        <div className="app-bar">{t('crowd_report_title', lang)}</div>
        <div className="center-column">
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            {t('report_success_title', lang)}
          </h2>
          <p className="subtitle" style={{ fontSize: 16 }}>
            {result.station.name} · +{result.pointsAwarded} {t('points_earned', lang)}
          </p>
          {result.aiAnalysis && Number.isFinite(result.aiAnalysis.peopleCount) && (
            <p className="helper-text">
              🤖 {t('ai_detected', lang).replace('{n}', result.aiAnalysis.peopleCount)}
            </p>
          )}
          <div className="badge-circle" style={{ marginTop: 12 }}>
            <div className="num">{result.totalPoints}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t('total_points', lang)}</div>
          </div>
          <button className="primary-btn" style={{ marginTop: 24, maxWidth: 220 }} onClick={() => nav('/home')}>
            {t('done_btn', lang)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-bar">
        <button className="back" onClick={() => nav(-1)}>←</button>
        {t('crowd_report_title', lang)}
      </div>

      <div className="screen-body">
        <p className="subtitle">{t('crowd_report_sub', lang)}</p>

        {/* ---- Location: detected automatically, never picked by hand ---- */}
        {locationStatus === 'locating' && (
          <div className="card">
            <div className="icon-circle">📡</div>
            <div>{t('detecting_location', lang)}</div>
          </div>
        )}

        {(locationStatus === 'denied' || locationStatus === 'error') && (
          <div className="card" style={{ cursor: 'default' }}>
            <div className="icon-circle">📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('location_needed_title', lang)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                {t('location_denied_msg', lang)}
              </div>
              <button className="outline-btn" onClick={locateMe}>{t('retry_location', lang)}</button>
            </div>
          </div>
        )}

        {locationStatus === 'granted' && nearest?.withinRange && (
          <div className="card" style={{ cursor: 'default' }}>
            <div className="icon-circle">📍</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{nearest.station.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('you_are_at', lang)} · {nearest.distanceMeters}{t('meters_away', lang)}
              </div>
            </div>
            <span>✅</span>
          </div>
        )}

        {locationStatus === 'granted' && nearest && !nearest.withinRange && (
          <div className="card" style={{ cursor: 'default' }}>
            <div className="icon-circle">⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('too_far_title', lang)}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                {t('too_far_msg', lang)} ({nearest.station.name} — {(nearest.distanceMeters / 1000).toFixed(1)}km)
              </div>
              <button className="outline-btn" onClick={locateMe}>{t('retry_location', lang)}</button>
            </div>
          </div>
        )}

        <label className="field-label">{t('report_mode_label', lang)}</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <button
            className={reportMode === 'media' ? 'primary-btn' : 'outline-btn'}
            style={{ flex: 1 }}
            onClick={() => setReportMode('media')}
          >
            📷 {t('report_mode_media', lang)}
          </button>
          <button
            className={reportMode === 'text' ? 'primary-btn' : 'outline-btn'}
            style={{ flex: 1 }}
            onClick={() => {
              setReportMode('text');
              setFile(null);
              setPreviewUrl(null);
              setAiResult(null);
            }}
          >
            ✍️ {t('report_mode_text', lang)}
          </button>
        </div>
        {reportMode === 'text' && <p className="helper-text">{t('text_report_helper', lang)}</p>}

        <label className="field-label">{t('people_count_label', lang)}</label>
        <input
          type="number"
          min="0"
          max="500"
          placeholder="0"
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
        />
        <p className="helper-text">{t('people_count_helper', lang)}</p>

        {reportMode === 'media' && (
        <>
        <label className="field-label">{t('media_label', lang)}</label>

        {/* Direct-to-camera capture — these open the camera app itself
            rather than a gallery/file picker, so the media is taken right
            now rather than pulled from an old photo/video. */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleVideoChange}
        />

        {!previewUrl && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <button className="outline-btn" onClick={() => photoInputRef.current?.click()}>
              📷 {t('take_photo', lang)}
            </button>
            <button className="outline-btn" onClick={() => videoInputRef.current?.click()}>
              🎥 {t('record_video', lang)}
            </button>
          </div>
        )}

        {previewUrl && (
          <div style={{ marginBottom: 12 }}>
            {isVideo ? (
              <video
                src={previewUrl}
                controls
                style={{ width: '100%', borderRadius: 14, maxHeight: 260, background: '#000' }}
              />
            ) : (
              <img
                src={previewUrl}
                alt="preview"
                style={{ width: '100%', borderRadius: 14, maxHeight: 260, objectFit: 'cover' }}
              />
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="outline-btn" onClick={() => photoInputRef.current?.click()}>
                📷 {t('take_photo', lang)}
              </button>
              <button className="outline-btn" onClick={() => videoInputRef.current?.click()}>
                🎥 {t('record_video', lang)}
              </button>
            </div>
          </div>
        )}
        <p className="helper-text">{t('media_helper', lang)}</p>

        {aiAnalyzing && <p className="helper-text">🤖 {t('ai_analyzing', lang)}</p>}
        {!aiAnalyzing && aiResult && Number.isFinite(aiResult.peopleCount) && (
          <p className="helper-text">
            🤖 {t(aiResult.confidence === 'low' ? 'ai_detected_confidence_low' : 'ai_detected', lang).replace('{n}', aiResult.peopleCount)}
          </p>
        )}
        {!aiAnalyzing && aiResult && !Number.isFinite(aiResult.peopleCount) && (
          <p className="helper-text">🤖 {t('ai_unavailable', lang)}</p>
        )}
        </>
        )}

        {error && <p className="error-text">{error}</p>}

        <button
          className="primary-btn"
          style={{ marginTop: 16 }}
          disabled={submitting || !nearest?.withinRange}
          onClick={handleSubmit}
        >
          {submitting ? t('submitting_report', lang) : t('submit_report_btn', lang)}
        </button>
      </div>
    </div>
  );
}
