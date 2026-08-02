// Backend URL, resolved automatically so this works whether you're on the
// PC running the server or on a phone/other device hitting it over wifi.
//
// - If you set VITE_API_URL in a .env file, that always wins (use this for
//   ngrok or a real deployed backend — see README).
// - Otherwise, we reuse whatever hostname/IP the page itself was loaded
//   from (e.g. 192.168.1.23) and just swap the port to 3000. This is what
//   makes "open on phone" work without editing code each time.
export const BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

async function handleJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || 'Request failed');
  }
  return body;
}

export async function registerUser({ role, name, phone }) {
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, name, phone }),
  });
  return handleJson(res);
}

export async function getStations() {
  const res = await fetch(`${BASE_URL}/stations`);
  return handleJson(res);
}

export async function joinQueue({ userId, stationId, destinationId }) {
  const res = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, stationId, destinationId }),
  });
  return handleJson(res);
}

export async function getQueueStatus(entryId) {
  const res = await fetch(`${BASE_URL}/queue/${entryId}/status`);
  return handleJson(res);
}

export async function confirmQueueEntry(entryId) {
  const res = await fetch(`${BASE_URL}/queue/${entryId}/confirm`, { method: 'POST' });
  return handleJson(res);
}

export async function cancelQueueEntry(entryId) {
  const res = await fetch(`${BASE_URL}/queue/${entryId}`, { method: 'DELETE' });
  return handleJson(res);
}

// Submits a crowd (in-person line) report: a photo or short video plus a
// self-reported headcount. `formData` must be a FormData with fields
// stationId, reporterUserId, peopleCount, and a `media` file — built by the
// caller so the browser can set the correct multipart boundary itself.
export async function submitCrowdReport(formData) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    body: formData,
  });
  return handleJson(res);
}

// Sends a just-picked photo/video to the AI for a live "how many people do
// you see" estimate, before the report is actually submitted. Nothing is
// stored server-side for this call. `file` is a raw File/Blob (not wrapped
// in FormData yet — this function does that).
export async function analyzeCrowdMedia(file) {
  const formData = new FormData();
  formData.append('media', file);
  const res = await fetch(`${BASE_URL}/reports/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleJson(res);
}

export async function getLatestStationReport(stationId) {
  const res = await fetch(`${BASE_URL}/reports/station/${stationId}`);
  return handleJson(res);
}

export async function getNearestStation(lat, lng) {
  const res = await fetch(`${BASE_URL}/reports/nearest-station?lat=${lat}&lng=${lng}`);
  return handleJson(res);
}
