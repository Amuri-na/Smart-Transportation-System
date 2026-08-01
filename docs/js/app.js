/**
 * Smart Transportation System - Main Application Orchestrator
 * City: Addis Ababa, Ethiopia
 */

const App = (function() {
    let currentScreen = 'splash';
    let selectedStationId = 'st_bole';
    let currentTheme = 'dark';
    let currentLang = 'en'; // 'en' or 'am'

    return {
        init() {
            console.log('🚀 Initializing Smart Transportation System Demo...');

            // Start Station Live Engine
            StationManager.startLiveUpdates();

            // Start Notification Simulator
            NotificationManager.startAutoSimulation();

            // Initialize Event Bus Listeners
            this.bindEvents();

            // Setup Search Autocomplete
            this.setupSearch();

            // Render Home Dashboard Components
            this.renderHomeDashboard();

            // Initialize Map
            MapModule.init('map-container');

            // Apply default theme
            this.setTheme(currentTheme);
        },

        bindEvents() {
            // Listen for station selections
            window.EventBus.on('station:selected', (stationId) => {
                this.selectStation(stationId);
            });

            // Listen for live updates to update visible UI cards dynamically
            window.EventBus.on('stations:live_batch_updated', (updatedList) => {
                this.refreshVisibleData(updatedList);
            });

            window.EventBus.on('station:updated', (data) => {
                this.refreshVisibleData([data.station]);
            });
        },

        /**
         * Navigation between screens: 'splash', 'welcome', 'home', 'map', 'settings'
         */
        showScreen(screenId) {
            currentScreen = screenId;

            const screens = document.querySelectorAll('.screen');
            screens.forEach(s => s.classList.remove('active'));

            const targetScreen = document.getElementById(`screen-${screenId}`);
            if (targetScreen) {
                targetScreen.classList.add('active');
            }

            // Update bottom navigation bar active state
            const navItems = document.querySelectorAll('.bottom-nav-item');
            navItems.forEach(item => {
                const target = item.getAttribute('data-screen');
                if (target === screenId) item.classList.add('active');
                else item.classList.remove('active');
            });

            // If map screen activated, invalidate map size for correct rendering
            if (screenId === 'map') {
                MapModule.refreshSize();
            }
        },

        /**
         * Render Home Dashboard Widgets
         */
        renderHomeDashboard() {
            this.renderGreeting();
            this.renderRecommendedCard();
            this.renderNearbyStations();
            this.renderRecentSearches();
        },

        renderGreeting() {
            const greetingEl = document.getElementById('user-greeting');
            const now = new Date();
            const hrs = now.getHours();
            let timeOfDay = 'Good Morning';
            if (hrs >= 12 && hrs < 17) timeOfDay = 'Good Afternoon';
            else if (hrs >= 17) timeOfDay = 'Good Evening';

            if (greetingEl) {
                greetingEl.innerHTML = `
                    <span class="greeting-sub">Selam, Addis Ababa Commuter 👋</span>
                    <h1 class="greeting-main">${timeOfDay}!</h1>
                `;
            }
        },

        renderRecommendedCard() {
            const container = document.getElementById('recommended-station-banner');
            if (!container) return;

            const recommended = StationManager.getRecommendedStation();
            if (!recommended) return;

            const statusColor = Utils.getStatusColor(recommended.waitTime);

            container.innerHTML = `
                <div class="rec-banner-card" onclick="App.selectStation('${recommended.id}')">
                    <div class="banner-badge">✨ Smart Pick • Save Time</div>
                    <div class="banner-body">
                        <div class="banner-info">
                            <h3 class="banner-title">${recommended.name}</h3>
                            <div class="banner-subcity">${recommended.amharicName} • ${recommended.subcity}</div>
                            <div class="banner-metrics">
                                <span class="metric-tag font-bold" style="color: ${statusColor.bg}">⏱️ ${recommended.waitTime} mins wait</span>
                                <span class="metric-tag">🚖 ${recommended.availableTaxis} Taxis</span>
                                <span class="metric-tag">👥 ${recommended.queueCount} in line</span>
                            </div>
                        </div>
                        <div class="banner-action-btn">
                            <span>View Details →</span>
                        </div>
                    </div>
                </div>
            `;
        },

        renderNearbyStations() {
            const container = document.getElementById('nearby-stations-list');
            if (!container) return;

            const nearby = StationManager.getNearby(5);

            container.innerHTML = nearby.map(station => {
                const statusColor = Utils.getStatusColor(station.waitTime);
                return `
                    <div class="station-card" onclick="App.selectStation('${station.id}')">
                        <div class="card-top">
                            <div class="station-name-box">
                                <h4 class="st-title">${station.name}</h4>
                                <span class="st-amharic">${station.amharicName}</span>
                            </div>
                            <div class="status-pill" style="background-color: ${statusColor.lightBg}; color: ${statusColor.text}; font-weight: 600;">
                                ${statusColor.status}
                            </div>
                        </div>

                        <div class="card-metrics-grid">
                            <div class="metric-item">
                                <span class="lbl">Wait Time</span>
                                <span class="val font-bold" style="color: ${statusColor.bg}">${station.waitTime} mins</span>
                            </div>
                            <div class="metric-item">
                                <span class="lbl">Available Taxis</span>
                                <span class="val font-semibold text-gray-200">${station.availableTaxis}</span>
                            </div>
                            <div class="metric-item">
                                <span class="lbl">Queue Line</span>
                                <span class="val text-gray-300">${station.queueCount} people</span>
                            </div>
                            <div class="metric-item">
                                <span class="lbl">Distance</span>
                                <span class="val text-gray-300">${Utils.formatDistance(station.distance)}</span>
                            </div>
                        </div>

                        <!-- Queue Progress Meter -->
                        <div class="queue-bar-container">
                            <div class="queue-bar-fill" style="width: ${Math.min(100, (station.queueCount / 60) * 100)}%; background-color: ${statusColor.bg}"></div>
                        </div>

                        <div class="card-footer">
                            <span class="updated-at">Updated ${Utils.getConfidenceRating(0).badge}</span>
                            <button class="card-btn" onclick="event.stopPropagation(); App.openRecommendationFor('${station.id}')">
                                Compare & Save Time
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderRecentSearches() {
            const container = document.getElementById('recent-searches-list');
            if (!container) return;

            const recents = [
                { name: 'Bole Terminal', wait: '24m', status: 'red' },
                { name: 'Mexico Square', wait: '14m', status: 'yellow' },
                { name: 'Gerji Station', wait: '4m', status: 'green' }
            ];

            container.innerHTML = recents.map(r => `
                <div class="recent-item-chip" onclick="App.searchAndSelect('${r.name}')">
                    <span class="chip-icon">🕒</span>
                    <span class="chip-text">${r.name}</span>
                    <span class="chip-wait ${r.status}">${r.wait}</span>
                </div>
            `).join('');
        },

        /**
         * Search Bar Autocomplete Logic
         */
        setupSearch() {
            const searchInputs = [
                document.getElementById('dashboard-search-input'),
                document.getElementById('map-search-input')
            ];

            searchInputs.forEach(input => {
                if (!input) return;

                const resultsDropdown = document.createElement('div');
                resultsDropdown.className = 'search-autocomplete-dropdown';
                input.parentElement.appendChild(resultsDropdown);

                input.addEventListener('input', Utils.debounce((e) => {
                    const query = e.target.value.trim();
                    if (query.length === 0) {
                        resultsDropdown.classList.remove('active');
                        return;
                    }

                    const matches = StationManager.search(query);

                    if (matches.length === 0) {
                        resultsDropdown.innerHTML = `<div class="p-3 text-sm text-gray-400">No transit stations found matching "${query}"</div>`;
                    } else {
                        resultsDropdown.innerHTML = matches.map(s => `
                            <div class="search-item" onclick="App.selectStation('${s.id}'); this.parentElement.classList.remove('active');">
                                <div class="font-semibold text-gray-100">${s.name}</div>
                                <div class="text-xs text-gray-400">${s.amharicName} • ${s.subcity}</div>
                                <div class="text-xs text-emerald-400 mt-1">⏱️ ${s.waitTime} mins wait • 🚖 ${s.availableTaxis} taxis</div>
                            </div>
                        `).join('');
                    }

                    resultsDropdown.classList.add('active');
                }, 200));

                // Close dropdown on click outside
                document.addEventListener('click', (e) => {
                    if (!input.contains(e.target) && !resultsDropdown.contains(e.target)) {
                        resultsDropdown.classList.remove('active');
                    }
                });
            });
        },

        searchAndSelect(stationName) {
            const matches = StationManager.search(stationName);
            if (matches.length > 0) {
                this.selectStation(matches[0].id);
            }
        },

        /**
         * Open station detail card / bottom sheet
         */
        selectStation(stationId) {
            selectedStationId = stationId;
            const station = StationManager.getById(stationId);
            if (!station) return;

            // Switch to Map Screen
            this.showScreen('map');

            // Pan map to station
            MapModule.panToLocation(station.lat, station.lng);

            // Render bottom sheet card
            this.renderStationDetailSheet(station);
        },

        /**
         * Render Bottom Sheet / Detail Panel for Selected Station
         */
        renderStationDetailSheet(station) {
            const sheet = document.getElementById('station-detail-sheet');
            if (!sheet) return;

            const statusColor = Utils.getStatusColor(station.waitTime);
            const congestionColor = Utils.getCongestionColor(station.congestion);
            const confidence = Utils.getConfidenceRating(1);

            sheet.innerHTML = `
                <div class="sheet-handle"></div>

                <div class="sheet-header">
                    <div>
                        <div class="sheet-title-row">
                            <h2 class="sheet-title">${station.name}</h2>
                            ${station.isRecommended ? `<span class="rec-badge">✨ Recommended Pick</span>` : ''}
                        </div>
                        <div class="sheet-subcity">${station.amharicName} • ${station.subcity}</div>
                    </div>
                    <button class="sheet-close-btn" onclick="App.closeStationSheet()">&times;</button>
                </div>

                <!-- Live Metrics Highlights Grid -->
                <div class="sheet-metrics-grid" id="station-detail-card">
                    <div class="metric-card-box highlight">
                        <span class="m-label">Est. Waiting Time</span>
                        <span class="m-value font-bold" style="color: ${statusColor.bg}">${station.waitTime} mins</span>
                        <span class="m-sub">Range: ${station.minWait} - ${station.maxWait} mins</span>
                    </div>

                    <div class="metric-card-box">
                        <span class="m-label">Available Taxis</span>
                        <span class="m-value text-blue-400">${station.availableTaxis} Taxis</span>
                        <span class="m-sub">Active in terminal</span>
                    </div>

                    <div class="metric-card-box">
                        <span class="m-label">Queue Length</span>
                        <span class="m-value text-amber-400">${station.queueCount} Passengers</span>
                        <span class="m-sub">${statusColor.status}</span>
                    </div>

                    <div class="metric-card-box">
                        <span class="m-label">Road Congestion</span>
                        <span class="m-value" style="color: ${congestionColor.color}">${station.congestion}%</span>
                        <span class="m-sub">${congestionColor.label}</span>
                    </div>
                </div>

                <!-- Confidence Indicator Bar -->
                <div class="confidence-bar-wrapper">
                    <div class="confidence-info">
                        <span>Reliability Index: <strong>${confidence.score}% ${confidence.label}</strong></span>
                        <span class="badge-tag">${confidence.badge}</span>
                    </div>
                    <div class="confidence-track">
                        <div class="confidence-fill" style="width: ${confidence.score}%; background-color: ${confidence.color};"></div>
                    </div>
                </div>

                <!-- AI Smart Tip Banner if alternative available -->
                ${station.alternativeId ? `
                    <div class="ai-tip-banner" onclick="App.openRecommendationFor('${station.id}')">
                        <div class="tip-icon">💡</div>
                        <div class="tip-content">
                            <div class="tip-title">Smart Recommendation Available</div>
                            <div class="tip-desc">${station.alternativeReason}</div>
                        </div>
                        <button class="tip-action-btn">Compare →</button>
                    </div>
                ` : ''}

                <!-- Action Buttons Grid -->
                <div class="sheet-actions-grid">
                    <button class="btn btn-primary" onclick="App.navigateToStation('${station.id}')">
                        🚀 Navigate Route
                    </button>
                    <button class="btn btn-secondary" onclick="QueueReportModule.openModal('${station.id}')">
                        📝 Report Queue
                    </button>
                    <button class="btn btn-outline" onclick="App.toggleFavoriteStation('${station.id}')">
                        ${station.isFavorite ? '❤️ Bookmarked' : '🔖 Bookmark'}
                    </button>
                    <button class="btn btn-outline" onclick="App.shareStation('${station.id}')">
                        📤 Share
                    </button>
                </div>
            `;

            sheet.classList.add('active');
        },

        closeStationSheet() {
            const sheet = document.getElementById('station-detail-sheet');
            if (sheet) sheet.classList.remove('active');
        },

        /**
         * Open AI Recommendation Modal for given station
         */
        openRecommendationFor(stationId) {
            RecommendationEngine.renderComparisonModal(stationId);
        },

        closeRecommendationModal() {
            const modal = document.getElementById('recommendation-modal');
            if (modal) modal.classList.remove('active');
        },

        acceptRecommendation(altStationId) {
            this.closeRecommendationModal();
            this.selectStation(altStationId);
            this.navigateToStation(altStationId);
        },

        /**
         * Start Turn-by-Turn Navigation
         */
        navigateToStation(stationId) {
            this.closeStationSheet();
            NavigationModule.startNavigation(stationId);
        },

        toggleFavoriteStation(stationId) {
            const isFav = StationManager.toggleFavorite(stationId);
            const station = StationManager.getById(stationId);
            Utils.showToast(
                isFav ? `Added ${station.name} to bookmarks` : `Removed ${station.name} from bookmarks`,
                'success'
            );
            this.renderStationDetailSheet(station);
        },

        shareStation(stationId) {
            const station = StationManager.getById(stationId);
            if (navigator.share) {
                navigator.share({
                    title: `Smart Transport - ${station.name}`,
                    text: `Check live queue status at ${station.name}: ${station.waitTime} mins wait time.`,
                    url: window.location.href
                }).catch(() => {});
            } else {
                Utils.showToast(`Station link copied: ${station.name} (${station.waitTime} mins wait time)`, 'info');
            }
        },

        /**
         * Refresh visible UI widgets when live updates arrive
         */
        refreshVisibleData(updatedList) {
            // Re-render home widgets if on home screen
            if (currentScreen === 'home') {
                this.renderHomeDashboard();
            }

            // If selected station detail is open, refresh detail card
            if (selectedStationId) {
                const updated = updatedList.find(s => s.id === selectedStationId);
                if (updated && document.getElementById('station-detail-sheet')?.classList.contains('active')) {
                    this.renderStationDetailSheet(updated);
                }
            }
        },

        /**
         * Toggle Light / Dark Theme
         */
        setTheme(theme) {
            currentTheme = theme;
            document.body.setAttribute('data-theme', theme);

            // Notify map module
            MapModule.setMapTheme(theme);
        },

        toggleTheme() {
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(nextTheme);
            Utils.showToast(`Switched to ${nextTheme} theme`, 'info');
        },

        /**
         * Toggle Language (English / Amharic)
         */
        toggleLanguage() {
            currentLang = currentLang === 'en' ? 'am' : 'en';
            const langLabel = currentLang === 'en' ? 'English' : 'አማርኛ';
            Utils.showToast(`Language set to ${langLabel}`, 'info');
        }
    };
})();

// Bootstrap App when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
