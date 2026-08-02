// ---- AI crowd-counting for "Teraaskebari" reports ----
// Sends a crowd-report photo (or a single frame grabbed from a video) to
// Claude's vision API and asks it to count the people in the line.
//
// Requires an ANTHROPIC_API_KEY environment variable on the server. If it's
// not set, analysis is skipped gracefully (the manual headcount the
// passenger typed in still works fine on its own).
//
// Video support requires `ffmpeg` to be installed and on the server's PATH
// (used only to grab one still frame — the frame is deleted right after).

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const VISION_MODEL = 'claude-sonnet-5';

// Grabs a single still frame (around the 1s mark) from a video file using
// ffmpeg. Throws if ffmpeg isn't installed/available.
function extractVideoFrame(videoPath) {
  return new Promise((resolve, reject) => {
    const framePath = path.join(
      os.tmpdir(),
      `crowd_frame_${Date.now()}_${Math.round(Math.random() * 1e9)}.jpg`
    );
    execFile(
      'ffmpeg',
      ['-y', '-ss', '00:00:01', '-i', videoPath, '-frames:v', '1', framePath],
      (err) => {
        if (err) return reject(err);
        resolve(framePath);
      }
    );
  });
}

// Sends one image to Claude and asks it to count people in it.
// Returns { peopleCount, confidence, note? } — peopleCount is null if the
// model couldn't give a confident number or the request failed.
async function countPeopleInImage(imagePath, mimeType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      peopleCount: null,
      confidence: null,
      note: 'AI analysis is not configured (missing ANTHROPIC_API_KEY on the server).',
    };
  }

  const base64 = fs.readFileSync(imagePath).toString('base64');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            {
              type: 'text',
              text:
                'This is a photo of people waiting in line for a shared taxi ("Lada") in Addis Ababa. ' +
                'Count the number of distinct people visible who appear to be part of the line/queue. ' +
                'Reply with ONLY a JSON object and nothing else, in exactly this shape: ' +
                '{"peopleCount": <integer>, "confidence": "low" | "medium" | "high"}',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return {
      peopleCount: null,
      confidence: null,
      note: `AI analysis failed (${response.status}): ${errText.slice(0, 200)}`,
    };
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((c) => c.type === 'text');
  if (!textBlock) {
    return { peopleCount: null, confidence: null, note: 'AI did not return a readable answer.' };
  }

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const count = Number.isFinite(parsed.peopleCount) ? Math.max(0, Math.round(parsed.peopleCount)) : null;
    return { peopleCount: count, confidence: parsed.confidence || null };
  } catch (e) {
    return { peopleCount: null, confidence: null, note: 'Could not parse the AI response.' };
  }
}

// Public entry point. Works for an image file OR a video file (a frame is
// grabbed from the video first). Never throws — always resolves to
// { peopleCount, confidence, note? } so a failed/unconfigured AI call never
// blocks a report from being submitted.
async function analyzeCrowdMedia(filePath, mimeType) {
  try {
    if (mimeType.startsWith('image/')) {
      return await countPeopleInImage(filePath, mimeType);
    }

    if (mimeType.startsWith('video/')) {
      let framePath;
      try {
        framePath = await extractVideoFrame(filePath);
      } catch (err) {
        return {
          peopleCount: null,
          confidence: null,
          note: 'Video analysis needs ffmpeg installed on the server — showing the manual count only.',
        };
      }
      try {
        return await countPeopleInImage(framePath, 'image/jpeg');
      } finally {
        fs.unlink(framePath, () => {});
      }
    }

    return { peopleCount: null, confidence: null, note: 'Unsupported media type for AI analysis.' };
  } catch (err) {
    return { peopleCount: null, confidence: null, note: err.message || 'AI analysis failed.' };
  }
}

module.exports = { analyzeCrowdMedia };
