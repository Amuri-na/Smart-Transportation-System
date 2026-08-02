// ---- In-memory "database" for the prototype ----
// Swap this for a real DB (Postgres/Mongo) later; the shape stays the same.

let nextId = 1;
const genId = (prefix) => `${prefix}_${nextId++}`;

// Users: { id, role: 'driver' | 'passenger', name, phone }
const users = [];

// Valid Ethiopian mobile numbers in international format:
// +251 9XXXXXXXX  -> Ethio Telecom
// +251 7XXXXXXXX  -> Safaricom Ethiopia
// (country code +251, then a 9-digit subscriber number starting with 9 or 7)
const ET_PHONE_REGEX = /^\+251[79]\d{8}$/;

function isValidEthiopianPhone(phone) {
  return typeof phone === 'string' && ET_PHONE_REGEX.test(phone.trim());
}

// Stations with mock taxis approaching. Each taxi has an etaMinutes that
// counts down over time. When it hits 0, the taxi "arrives" and the next
// people waiting for that station get "called" with a turn window.
// Stations/routes here reflect real Addis Ababa shared-taxi ("Lada") stops.
// lat/lng are approximate landmark coordinates (not survey-grade) used to
// match a phone's GPS location to the nearest station, both for crowd
// reports and for auto-selecting a passenger's starting station on Home.
//
// Every station can be a destination for every other station — see
// getDestinationsForStation() below — so there's no per-station destination
// list to maintain here as new stations get added.
function seedTaxis(...etas) {
  return etas.map((etaMinutes) => ({ id: genId('taxi'), etaMinutes }));
}

const stations = [
  { id: 'st_mexico', name: 'Mexico Square', lat: 9.0102, lng: 38.7445, taxiQueue: seedTaxis(3, 8, 15) },
  { id: 'st_stadium', name: 'Stadium (Arat Kilo)', lat: 9.0329, lng: 38.7634, taxiQueue: seedTaxis(4, 10) },
  { id: 'st_bole', name: 'Bole', lat: 9.0024, lng: 38.7999, taxiQueue: seedTaxis(2, 9, 14) },
  { id: 'st_merkato', name: 'Merkato', lat: 9.0280, lng: 38.7400, taxiQueue: seedTaxis(5, 11) },
  { id: 'st_megenagna', name: 'Megenagna', lat: 9.0197, lng: 38.7975, taxiQueue: seedTaxis(6, 13) },
  { id: 'st_kaliti', name: 'Kaliti', lat: 8.8935, lng: 38.7550, taxiQueue: seedTaxis(7, 16) },
  { id: 'st_lamberet', name: 'Lamberet', lat: 9.0250, lng: 38.8250, taxiQueue: seedTaxis(3, 12) },
  { id: 'st_gerji', name: 'Gerji', lat: 9.0140, lng: 38.8100, taxiQueue: seedTaxis(5, 10, 18) },
  { id: 'st_kotebe', name: 'Kotebe', lat: 9.0300, lng: 38.8450, taxiQueue: seedTaxis(6, 14) },
  { id: 'st_saris', name: 'Saris', lat: 8.9550, lng: 38.7650, taxiQueue: seedTaxis(4, 9) },
  { id: 'st_ayat', name: 'Ayat', lat: 9.0180, lng: 38.8700, taxiQueue: seedTaxis(8, 17) },
  { id: 'st_cmc', name: 'CMC', lat: 9.0350, lng: 38.8150, taxiQueue: seedTaxis(5, 12) },
  { id: 'st_piassa', name: 'Piassa', lat: 9.0350, lng: 38.7480, taxiQueue: seedTaxis(2, 7, 13) },
  { id: 'st_autobus_tera', name: 'Autobus Tera', lat: 9.0330, lng: 38.7420, taxiQueue: seedTaxis(3, 9) },
  { id: 'st_meskel_square', name: 'Meskel Square', lat: 9.0105, lng: 38.7610, taxiQueue: seedTaxis(4, 11) },
  { id: 'st_sidist_kilo', name: 'Sidist Kilo', lat: 9.0400, lng: 38.7620, taxiQueue: seedTaxis(5, 10) },
  { id: 'st_gotera', name: 'Gotera', lat: 8.9800, lng: 38.7650, taxiQueue: seedTaxis(6, 13) },
  { id: 'st_jemo', name: 'Jemo', lat: 8.9600, lng: 38.7300, taxiQueue: seedTaxis(7, 15) },
  { id: 'st_summit', name: 'Summit', lat: 9.0100, lng: 38.8250, taxiQueue: seedTaxis(4, 12) },
  { id: 'st_bole_michael', name: 'Bole Michael', lat: 8.9850, lng: 38.7950, taxiQueue: seedTaxis(3, 10) },
];

// Every station can be picked as a destination from every other station —
// this returns that list, sorted alphabetically, excluding the station
// itself. The destination "id" is just the target station's own id; it's
// only ever used as an opaque grouping key for queue/lada matching, never
// looked up as a real station on its own, so reusing it here is safe and
// keeps this list in sync automatically as stations are added or removed.
function getDestinationsForStation(stationId) {
  return stations
    .filter((s) => s.id !== stationId)
    .map((s) => ({ id: s.id, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Queue entries: { id, userId, stationId, destinationId, status, position,
//                   joinedAt, turnDeadline }
// status: 'waiting' | 'called' | 'confirmed' | 'expired' | 'cancelled'
const queueEntries = [];

// Lada groups: { id, stationId, destinationId, status, maxSize, memberIds,
//                 createdAt }
// status: 'pooling' | 'ready'
// A group is CLOSED the instant it reaches maxSize — no more people can be
// added to it. The next joiner starts (or joins) a fresh group.
const ladaGroups = [];

// Crowd reports: passengers physically at a station submit a photo/video of
// the actual line plus a self-reported headcount. { id, stationId,
//   reporterUserId, peopleCount, mediaPath, mediaType, createdAt }
// The most recent report per station (within CROWD_REPORT_VALID_MINUTES) is
// treated as "how many people are physically in line right now" and is
// added on top of app-based queue joiners, so someone who joins from their
// phone lines up behind the people who are actually standing there.
const crowdReports = [];

const TURN_WINDOW_MINUTES = 5; // time a called user has to check in
const LADA_GROUP_SIZE = 4; // exact group size requested
const CROWD_REPORT_VALID_MINUTES = 20; // how long a report counts as "current"
const CROWD_REPORT_POINTS = 10; // points awarded per submitted report

// ---------- Users ----------
function findOrCreateUser({ role, name, phone }) {
  let user = users.find((u) => u.phone === phone);
  if (user) {
    return user;
  }
  user = { id: genId('user'), role, name, phone, points: 0 };
  users.push(user);
  return user;
}

function addPointsToUser(userId, points) {
  const user = getUserById(userId);
  if (!user) return null;
  user.points = (user.points || 0) + points;
  return user;
}

function getUserById(id) {
  return users.find((u) => u.id === id);
}

// ---------- Stations ----------
function getStations() {
  return stations.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    destinations: getDestinationsForStation(s.id),
    nextTaxiEtaMinutes: s.taxiQueue[0] ? s.taxiQueue[0].etaMinutes : null,
    ...getPhysicalLineInfo(s.id),
  }));
}

function getStation(stationId) {
  return stations.find((s) => s.id === stationId);
}

// ---------- Location matching (crowd reports use this instead of trusting
// a self-picked station, so someone can't just claim to be somewhere
// they're not) ----------
const EARTH_RADIUS_M = 6371000;
const MAX_REPORT_DISTANCE_M = 2000; // how far from a station a report can still count

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Finds the closest station to a given GPS position. Returns
// { station, distanceMeters, withinRange } — withinRange is false if the
// person is too far from any known station for the report to be trusted.
function findNearestStation(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  let closest = null;
  let closestDistance = Infinity;
  stations.forEach((s) => {
    const d = haversineMeters(lat, lng, s.lat, s.lng);
    if (d < closestDistance) {
      closestDistance = d;
      closest = s;
    }
  });
  if (!closest) return null;
  return {
    station: closest,
    distanceMeters: Math.round(closestDistance),
    withinRange: closestDistance <= MAX_REPORT_DISTANCE_M,
  };
}

// ---------- Crowd reports (in-person line reports) ----------
function submitCrowdReport({
  stationId,
  reporterUserId,
  peopleCount,
  mediaPath,
  mediaType,
  reporterLat,
  reporterLng,
  aiPeopleCount = null,
}) {
  const report = {
    id: genId('report'),
    stationId,
    reporterUserId,
    peopleCount,
    mediaPath,
    mediaType,
    aiPeopleCount,
    reporterLat,
    reporterLng,
    createdAt: Date.now(),
  };
  crowdReports.push(report);
  const user = addPointsToUser(reporterUserId, CROWD_REPORT_POINTS);
  return { report, pointsAwarded: CROWD_REPORT_POINTS, totalPoints: user ? user.points : null };
}

function getLatestCrowdReport(stationId) {
  const cutoff = Date.now() - CROWD_REPORT_VALID_MINUTES * 60 * 1000;
  const recent = crowdReports
    .filter((r) => r.stationId === stationId && r.createdAt >= cutoff)
    .sort((a, b) => b.createdAt - a.createdAt);
  return recent[0] || null;
}

// How many people are physically standing in line right now, based on the
// most recent still-valid crowd report (0 if there is none).
function getPhysicalLineInfo(stationId) {
  const report = getLatestCrowdReport(stationId);
  if (!report) {
    return { physicalLineCount: 0, lastReportAgeMinutes: null };
  }
  return {
    physicalLineCount: report.peopleCount,
    lastReportAgeMinutes: Math.floor((Date.now() - report.createdAt) / 60000),
  };
}

// ---------- Queue ----------
function getQueuePosition(entry) {
  const sameLine = queueEntries.filter(
    (e) =>
      e.stationId === entry.stationId &&
      e.destinationId === entry.destinationId &&
      e.status === 'waiting'
  );
  const appQueuePosition = sameLine.findIndex((e) => e.id === entry.id) + 1;
  // People who joined via the app queue up *behind* everyone already
  // physically in line at the station, per the latest crowd report.
  const { physicalLineCount } = getPhysicalLineInfo(entry.stationId);
  return appQueuePosition + physicalLineCount;
}

function joinQueue({ userId, stationId, destinationId }) {
  const entry = {
    id: genId('q'),
    userId,
    stationId,
    destinationId,
    status: 'waiting',
    joinedAt: Date.now(),
    turnDeadline: null,
  };
  queueEntries.push(entry);
  return entry;
}

function getQueueEntry(entryId) {
  return queueEntries.find((e) => e.id === entryId);
}

function cancelQueueEntry(entryId) {
  const entry = getQueueEntry(entryId);
  if (!entry) return null;
  entry.status = 'cancelled';
  return entry;
}

function confirmQueueEntry(entryId) {
  const entry = getQueueEntry(entryId);
  if (!entry) return null;
  if (entry.status !== 'called') return entry;
  entry.status = 'confirmed';
  return entry;
}

// ---------- Lada matching (real-time) ----------
function findOpenLadaGroup(stationId, destinationId) {
  return ladaGroups.find(
    (g) =>
      g.stationId === stationId &&
      g.destinationId === destinationId &&
      g.status === 'pooling'
  );
}

// Adds a user to the open group for this station+destination (or starts a
// new one). Returns { group, justCompleted } where justCompleted is true
// only on the exact call that brought the group to LADA_GROUP_SIZE members
// — that's the signal the caller uses to reveal contacts to everyone in it.
function joinLadaPool({ userId, stationId, destinationId }) {
  let group = findOpenLadaGroup(stationId, destinationId);
  if (!group) {
    group = {
      id: genId('lada'),
      stationId,
      destinationId,
      status: 'pooling',
      maxSize: LADA_GROUP_SIZE,
      memberIds: [],
      createdAt: Date.now(),
    };
    ladaGroups.push(group);
  }

  let justAdded = false;
  if (!group.memberIds.includes(userId) && group.memberIds.length < group.maxSize) {
    group.memberIds.push(userId);
    justAdded = true;
  }

  const justCompleted = justAdded && group.memberIds.length === group.maxSize;
  if (group.memberIds.length >= group.maxSize) {
    group.status = 'ready';
  }

  return { group, justCompleted };
}

function getLadaGroup(groupId) {
  return ladaGroups.find((g) => g.id === groupId);
}

function getLadaGroupMembersWithContact(group) {
  return group.memberIds.map((id) => {
    const u = getUserById(id);
    return u ? { id: u.id, name: u.name, phone: u.phone } : { id };
  });
}

// ---------- Simulation loop (taxi ETA countdown / auto-cancel) ----------
function tickSimulation() {
  const now = Date.now();

  stations.forEach((station) => {
    const front = station.taxiQueue[0];
    if (!front) return;
    front.etaMinutes -= 1;

    if (front.etaMinutes <= 0) {
      const waiting = queueEntries
        .filter((e) => e.stationId === station.id && e.status === 'waiting')
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .slice(0, 4);

      waiting.forEach((entry) => {
        entry.status = 'called';
        entry.turnDeadline = now + TURN_WINDOW_MINUTES * 60 * 1000;
      });

      station.taxiQueue.shift();
      station.taxiQueue.push({
        id: genId('taxi'),
        etaMinutes: 5 + Math.floor(Math.random() * 15),
      });
    }
  });

  queueEntries.forEach((entry) => {
    if (
      entry.status === 'called' &&
      entry.turnDeadline &&
      now > entry.turnDeadline
    ) {
      entry.status = 'expired';
    }
  });
}

function startTaxiSimulation() {
  setInterval(tickSimulation, 15 * 1000);
}

module.exports = {
  isValidEthiopianPhone,
  findOrCreateUser,
  getUserById,
  addPointsToUser,
  getStations,
  getStation,
  joinQueue,
  getQueueEntry,
  getQueuePosition,
  cancelQueueEntry,
  confirmQueueEntry,
  joinLadaPool,
  getLadaGroup,
  getLadaGroupMembersWithContact,
  submitCrowdReport,
  getLatestCrowdReport,
  getPhysicalLineInfo,
  findNearestStation,
  LADA_GROUP_SIZE,
  CROWD_REPORT_POINTS,
  startTaxiSimulation,
};
