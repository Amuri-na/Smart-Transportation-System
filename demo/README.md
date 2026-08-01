# Smart Transportation System (STS) - Interactive Vision Demo
**Focus City:** Addis Ababa, Ethiopia  
**Mission:** Help passengers make better transportation decisions by reducing uncertainty around minibus taxi availability, queue length, congestion, and waiting times.

---

## 🌟 Purpose
This interactive vision demo showcases the user experience and core decision-support workflows for the **Smart Transportation System (STS)** in Addis Ababa. It demonstrates how real-time crowdsourced queue reporting, AI-driven alternative route recommendations, and visual interactive maps empower commuters to avoid crowded hubs (e.g., Bole, Megenagna) and save up to 20+ minutes per trip.

---

## 🚀 Key Features

1. **Splash Screen & Onboarding:**
   - Animated logo, tagline ("Know Before You Go"), and quick start flow.

2. **Home Dashboard:**
   - Real-time station search with live autocomplete.
   - Weather widget and quick action grid (Find Taxi, View Map, Smart AI, Report Queue).
   - Dynamic AI recommendation card (highlighting time savings).
   - Nearby transit hubs sorted by proximity.

3. **Interactive Map (Leaflet & CartoDB Voyager/Dark):**
   - 12 realistic Addis Ababa minibus terminals (Bole, Mexico, Megenagna, Piassa, Sarbet, CMC, Ayat, Lebu, Tor Hailoch, Gerji, Gotera, Stadium).
   - Custom color-coded markers (Green = Low wait < 5m, Yellow = Moderate 5-15m, Red = Heavy > 15m).
   - Real-time taxi counts and passenger queue numbers rendered directly on map pins.

4. **Station Details & Bottom Sheet:**
   - Detailed metrics: Estimated wait time, min/max range, active taxi count, road congestion %, queue length meter, and reliability index.
   - Action buttons: Navigate Route, Report Queue, Bookmark, Share.

5. **AI Recommendation & Comparison Engine:**
   - Compares overloaded hubs (e.g., Bole Terminal) with nearby low-queue alternatives (e.g., Gerji Station).
   - Side-by-side comparison cards showing net time saved, queue difference, and clear bulleted rationale.

6. **Community Queue Reporting:**
   - Interactive modal to report current queue length (Very Short to Very Long), available taxis count, and road congestion.
   - Instant live state updates + Toast notification feedback (+15 Karma points).

7. **Simulated Turn-by-Turn Navigation:**
   - Draws glowing route polyline on map from user origin (Meskel Square) to destination.
   - Animated vehicle marker following the route in real-time.
   - ETA countdown, step-by-step walking & minibus boarding directions.

8. **5-Second Dynamic Live Updates Engine:**
   - Background engine automatically fluctuates station queue levels and taxi counts every 5 seconds without page refresh.
   - Animated toast notifications for queue decreases and traffic alerts.

---

## 📂 Folder Structure

```
demo/
├── index.html            # Main HTML single-page application entry point
├── css/
│   └── style.css         # Modern Google Maps / Material Design 3 stylesheet & theme tokens
├── js/
│   ├── utils.js          # Helpers, status color mappers, toast alerts, event bus
│   ├── stations.js       # 12 Addis Ababa station objects & live simulation engine
│   ├── recommendation.js # AI alternative comparison logic & modal generator
│   ├── queue.js          # Community queue reporting modal & submission handler
│   ├── navigation.js     # Simulated turn-by-turn navigation & polyline animator
│   ├── notifications.js  # Live push notification alerts & history manager
│   ├── map.js            # Leaflet interactive map module & custom marker renderer
│   └── app.js            # Main application orchestrator & view state manager
├── assets/               # Image and icon assets
└── README.md             # Project documentation
```

---

## 💻 How to Run

1. **Option 1: Direct File Opening**
   - Open `demo/index.html` directly in any web browser (Chrome, Firefox, Safari, Edge).

2. **Option 2: Local HTTP Server (Recommended)**
   - Run a simple HTTP server inside the `demo/` folder:
     ```bash
     npx serve demo
     # or
     python3 -m http.server 8000 --directory demo
     ```
   - Open `http://localhost:8000` in your browser.

---

## 🔗 Future Integration (Backend & IoT Roadmap)

This vision demo is architected with modular vanilla JavaScript so it can be seamlessly connected to real backend services and IoT hardware:

* **Real Hardware Integrations:**
  - Computer Vision camera sensors at minibus terminals to count queue lengths automatically.
  - GPS transponders on minibus taxis for automated location tracking.
* **Backend APIs:**
  - WebSocket / SSE feeds for real-time queue broadcasts.
  - Machine learning models (predicting peak hour queue spikes across Addis Ababa subcities).
* **Payment & Ticketing:**
  - Telebirr / Chapa digital ticketing integration for contactless passenger boarding.

---

## ⚠️ Limitations & Notes

- **Data Simulation:** All station coordinates, queue lengths, taxi numbers, and traffic congestion percentages are realistic simulations based on typical Addis Ababa traffic patterns.
- **Offline Maps:** Map tiles are loaded via open CDN (CartoDB / OpenStreetMap). Internet connection is recommended for tile rendering.
