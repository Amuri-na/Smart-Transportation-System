/**
 * Smart Transportation System - Map Module (Leaflet Powered)
 * City: Addis Ababa, Ethiopia
 */

const MapModule = (function() {
    let map = null;
    let markersMap = new Map(); // stationId -> L.Marker
    let userMarker = null;
    let routePolyline = null;
    let activeNavMarker = null;
    let currentMapTileStyle = 'carto_voyager';

    // Tile Layer Configurations
    const tileLayers = {
        carto_voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        carto_dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    };

    let activeTileLayerObj = null;

    return {
        /**
         * Initialize Leaflet map instance
         */
        init(containerId = 'map-container') {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Centered on Meskel Square / Addis Ababa Center
            const center = [9.0105, 38.7612];
            map = L.map(containerId, {
                center,
                zoom: 13,
                zoomControl: false,
                attributionControl: false
            });

            // Set default tile layer
            activeTileLayerObj = L.tileLayer(tileLayers.carto_voyager, {
                maxZoom: 19,
                subdomains: 'abcd'
            }).addTo(map);

            // Position controls at bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Add user location pin
            this.addUserLocationMarker();

            // Load station markers
            this.renderStationMarkers(StationManager.getAll());

            // Listen to station updates
            window.EventBus.on('stations:live_batch_updated', (updatedList) => {
                this.updateMarkersBatch(updatedList);
            });

            window.EventBus.on('station:updated', (data) => {
                this.updateSingleMarker(data.station);
            });

            window.EventBus.on('navigation:started', (route) => {
                this.drawNavigationRoute(route);
            });

            window.EventBus.on('navigation:progress', (data) => {
                this.updateNavMarkerPosition(data.pos);
            });

            window.EventBus.on('navigation:stopped', () => {
                this.clearNavigationRoute();
            });

            // Resize invalidate map fix for tabs
            setTimeout(() => map.invalidateSize(), 300);
        },

        /**
         * Add User Current Location Marker (Meskel Square)
         */
        addUserLocationMarker() {
            const origin = NavigationModule.getUserOrigin();
            const userIcon = L.divIcon({
                className: 'user-location-marker-container',
                html: `
                    <div class="user-pulse-ring"></div>
                    <div class="user-location-pin">
                        <span class="dot"></span>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            userMarker = L.marker([origin.lat, origin.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
            userMarker.bindTooltip("📍 You are here (Meskel Square)", { permanent: false, direction: 'top' });
        },

        /**
         * Create custom HTML marker element for station
         */
        createStationMarkerHtml(station) {
            const statusColor = Utils.getStatusColor(station.waitTime);
            return `
                <div class="station-map-marker ${station.isRecommended ? 'recommended-glow' : ''}" id="marker-${station.id}">
                    <div class="marker-badge" style="background-color: ${statusColor.bg};">
                        <span>⏱️ ${station.waitTime}m</span>
                    </div>
                    <div class="marker-body">
                        <div class="marker-title">${station.name}</div>
                        <div class="marker-sub">🚖 ${station.availableTaxis} taxis • 👥 ${station.queueCount}</div>
                    </div>
                    ${station.isRecommended ? `<div class="marker-rec-star">✨</div>` : ''}
                </div>
            `;
        },

        /**
         * Render all station markers on map
         */
        renderStationMarkers(stationsList) {
            this.clearAllStationMarkers();

            stationsList.forEach(station => {
                const icon = L.divIcon({
                    className: 'custom-station-icon-wrapper',
                    html: this.createStationMarkerHtml(station),
                    iconSize: [120, 48],
                    iconAnchor: [60, 48]
                });

                const marker = L.marker([station.lat, station.lng], { icon }).addTo(map);

                marker.on('click', () => {
                    window.EventBus.emit('station:selected', station.id);
                    this.panToLocation(station.lat, station.lng);
                });

                markersMap.set(station.id, marker);
            });
        },

        /**
         * Update single marker UI on live changes
         */
        updateSingleMarker(station) {
            const marker = markersMap.get(station.id);
            if (!marker) return;

            const icon = L.divIcon({
                className: 'custom-station-icon-wrapper',
                html: this.createStationMarkerHtml(station),
                iconSize: [120, 48],
                iconAnchor: [60, 48]
            });
            marker.setIcon(icon);
        },

        /**
         * Update batch of markers from live engine
         */
        updateMarkersBatch(updatedStations) {
            updatedStations.forEach(st => this.updateSingleMarker(st));
        },

        /**
         * Clear all markers from map
         */
        clearAllStationMarkers() {
            markersMap.forEach(marker => map.removeLayer(marker));
            markersMap.clear();
        },

        /**
         * Filter markers visibility
         */
        filterMarkers(filterType) {
            const allStations = StationManager.getAll();
            let filtered = allStations;

            if (filterType === 'green') {
                filtered = StationManager.filterByStatus('green');
            } else if (filterType === 'recommended') {
                filtered = allStations.filter(s => s.isRecommended);
            } else if (filterType === 'low_queue') {
                filtered = allStations.filter(s => s.queueCount <= 15);
            }

            this.renderStationMarkers(filtered);
        },

        /**
         * Pan and zoom map to location smoothly
         */
        panToLocation(lat, lng, zoom = 15) {
            if (!map) return;
            map.flyTo([lat, lng], zoom, { duration: 1.2 });
        },

        /**
         * Toggle map style theme (Light vs Dark)
         */
        setMapTheme(themeName) {
            if (!map) return;
            if (activeTileLayerObj) map.removeLayer(activeTileLayerObj);

            const url = themeName === 'dark' ? tileLayers.carto_dark : tileLayers.carto_voyager;
            activeTileLayerObj = L.tileLayer(url, { maxZoom: 19, subdomains: 'abcd' }).addTo(map);
        },

        /**
         * Draw Navigation Polyline Route
         */
        drawNavigationRoute(route) {
            if (!map) return;
            this.clearNavigationRoute();

            // Draw thick glowing blue polyline
            routePolyline = L.polyline(route.waypoints, {
                color: '#3b82f6',
                weight: 6,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '10, 10'
            }).addTo(map);

            // Add animated navigation vehicle marker
            const navIcon = L.divIcon({
                className: 'nav-vehicle-marker',
                html: `<div class="nav-car-icon">🚕</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            activeNavMarker = L.marker(route.waypoints[0], { icon: navIcon, zIndexOffset: 2000 }).addTo(map);

            // Fit map bounds around route
            map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
        },

        /**
         * Update moving vehicle marker position during navigation
         */
        updateNavMarkerPosition(pos) {
            if (activeNavMarker) {
                activeNavMarker.setLatLng(pos);
            }
        },

        /**
         * Clear navigation polylines & vehicle marker
         */
        clearNavigationRoute() {
            if (routePolyline) {
                map.removeLayer(routePolyline);
                routePolyline = null;
            }
            if (activeNavMarker) {
                map.removeLayer(activeNavMarker);
                activeNavMarker = null;
            }
        },

        // Trigger map layout refresh
        refreshSize() {
            if (map) {
                setTimeout(() => map.invalidateSize(), 200);
            }
        }
    };
})();
