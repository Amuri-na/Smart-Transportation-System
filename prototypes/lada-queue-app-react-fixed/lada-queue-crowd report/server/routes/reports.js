const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { submitCrowdReport, getLatestCrowdReport, findNearestStation } = require('../store');
const { analyzeCrowdMedia } = require('../services/aiVision');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Accept a single photo or short video per report. Video *length* (max 20s)
// is checked in the browser before upload (server can't easily read a
// video's duration without extra native tooling); here we just cap file
// size as a sane backstop against huge uploads.
const MAX_UPLOAD_BYTES = 60 * 1024 * 1024; // 60MB safety cap

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image or video files are allowed'));
    }
  },
});

// POST /reports  multipart/form-data:
//   lat, lng, reporterUserId, peopleCount, media (file, OPTIONAL)
// The station is determined from the device's GPS coordinates, not from a
// value the client claims — this is what stops someone from reporting a
// line at a station they aren't actually at.
//
// A report can be made with a photo, a short video, or just plain text
// (peopleCount alone, no media) — all three count equally toward "how many
// people are physically in line right now", which is what makes anyone
// joining the queue from their phone line up *behind* that number (see
// getQueuePosition in store.js).
router.post('/', upload.single('media'), async (req, res) => {
  const { lat, lng, reporterUserId, peopleCount } = req.body;

  if (!lat || !lng || !reporterUserId || !peopleCount) {
    return res.status(400).json({ error: 'lat, lng, reporterUserId and peopleCount are required' });
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const match = findNearestStation(latNum, lngNum);

  if (!match) {
    return res.status(400).json({ error: 'Could not read a valid location' });
  }
  if (!match.withinRange) {
    return res.status(400).json({
      error: `You're about ${Math.round(match.distanceMeters / 100) / 10}km from the nearest station (${match.station.name}). Move closer to report its line.`,
    });
  }

  const count = parseInt(peopleCount, 10);
  if (Number.isNaN(count) || count < 0 || count > 500) {
    return res.status(400).json({ error: 'peopleCount must be a realistic number' });
  }

  // If a photo or video was attached, ask the AI how many people it sees so
  // the reporter (and anyone reading the report) gets an independent
  // estimate alongside their own count. This never blocks submission —
  // the reporter's typed-in count is still what's used for queue math.
  let aiAnalysis = null;
  if (req.file) {
    aiAnalysis = await analyzeCrowdMedia(req.file.path, req.file.mimetype);
  }

  const { report, pointsAwarded, totalPoints } = submitCrowdReport({
    stationId: match.station.id,
    reporterUserId,
    peopleCount: count,
    mediaPath: req.file ? `/uploads/${req.file.filename}` : null,
    mediaType: req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : 'text',
    reporterLat: latNum,
    reporterLng: lngNum,
    aiPeopleCount: aiAnalysis ? aiAnalysis.peopleCount : null,
  });

  res.json({
    report,
    pointsAwarded,
    totalPoints,
    station: { id: match.station.id, name: match.station.name },
    distanceMeters: match.distanceMeters,
    aiAnalysis,
  });
});

// POST /reports/analyze  multipart/form-data: media (file)
// Preview-only endpoint: lets the app show "AI detected ~X people" the
// moment someone picks a photo/video, before they've submitted the report.
// The uploaded file is deleted right after analysis — nothing is stored.
router.post('/analyze', upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'A photo or short video is required' });
  }
  try {
    const result = await analyzeCrowdMedia(req.file.path, req.file.mimetype);
    res.json(result);
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

// GET /reports/nearest-station?lat=&lng=
// Lets the app preview which station will be used before submitting.
router.get('/nearest-station', (req, res) => {
  const latNum = parseFloat(req.query.lat);
  const lngNum = parseFloat(req.query.lng);
  const match = findNearestStation(latNum, lngNum);
  if (!match) return res.status(400).json({ error: 'Invalid coordinates' });
  res.json({
    station: { id: match.station.id, name: match.station.name },
    distanceMeters: match.distanceMeters,
    withinRange: match.withinRange,
  });
});

// GET /reports/station/:stationId  -> latest still-current report, or null
router.get('/station/:stationId', (req, res) => {
  const report = getLatestCrowdReport(req.params.stationId);
  res.json(report);
});

module.exports = router;
