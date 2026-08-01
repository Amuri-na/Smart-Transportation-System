/**
 * Smart Transportation System - Navigation Demo Module
 * City: Addis Ababa, Ethiopia
 */

const NavigationModule = (function() {
    let currentRoute = null;
    let isNavigating = false;
    let animProgress = 0;
    let animInterval = null;

    // Fixed Starting Location for Demo: Meskel Square, Addis Ababa
    const userOrigin = {
        name: 'Meskel Square, Addis Ababa',
        lat: 9.0105,
        lng: 38.7612
    };

    return {
        getUserOrigin() {
            return userOrigin;
        },

        /**
         * Generate realistic route steps for an Addis Ababa destination
         */
        planRoute(destinationStationId) {
            const dest = StationManager.getById(destinationStationId);
            if (!dest) return null;

            // Generate intermediate polyline waypoints for realistic road curve
            const waypoints = [
                [userOrigin.lat, userOrigin.lng],
                [
                    userOrigin.lat + (dest.lat - userOrigin.lat) * 0.35 + 0.0012,
                    userOrigin.lng + (dest.lng - userOrigin.lng) * 0.3 - 0.0018
                ],
                [
                    userOrigin.lat + (dest.lat - userOrigin.lat) * 0.7 - 0.0008,
                    userOrigin.lng + (dest.lng - userOrigin.lng) * 0.75 + 0.0015
                ],
                [dest.lat, dest.lng]
            ];

            // Turn-by-turn instructions
            const instructions = [
                {
                    icon: 'walk',
                    text: `Walk 150m from ${userOrigin.name} toward main boulevard.`,
                    distance: '150 m',
                    duration: '2 mins'
                },
                {
                    icon: 'taxi',
                    text: `Board Minibus Taxi (Destination: ${dest.name}).`,
                    subtext: `Fare: 10 - 15 ETB • Boarding queue: ${dest.queueCount} passengers`,
                    distance: Utils.formatDistance(dest.distance * 0.8),
                    duration: `${Math.round(dest.driveTime * 0.75)} mins`
                },
                {
                    icon: 'traffic',
                    text: `Pass through major junction into ${dest.subcity}.`,
                    subtext: `Current Congestion: ${dest.congestion}% (${Utils.getCongestionColor(dest.congestion).label})`,
                    distance: Utils.formatDistance(dest.distance * 0.2),
                    duration: `${Math.round(dest.driveTime * 0.25)} mins`
                },
                {
                    icon: 'flag',
                    text: `Arrive at ${dest.name} (${dest.amharicName}).`,
                    subtext: `Estimated Queue Wait: ${dest.waitTime} mins`,
                    distance: 'Destination',
                    duration: 'Arrived'
                }
            ];

            currentRoute = {
                origin: userOrigin,
                destination: dest,
                distance: dest.distance,
                driveTime: dest.driveTime,
                walkTime: Math.round(dest.distance / 70), // ~70m per min
                waypoints,
                instructions
            };

            return currentRoute;
        },

        /**
         * Start active simulated navigation
         */
        startNavigation(destinationStationId) {
            const route = this.planRoute(destinationStationId);
            if (!route) return;

            isNavigating = true;
            animProgress = 0;

            // Render navigation UI overlay
            this.renderNavigationPanel(route);

            // Notify map module to draw route polyline
            window.EventBus.emit('navigation:started', route);

            Utils.showToast(
                `Navigation started to ${route.destination.name}. Estimated arrival in ${route.driveTime} mins.`,
                'info',
                'GPS Route Active'
            );

            // Start animated position marker along waypoints
            if (animInterval) clearInterval(animInterval);
            animInterval = setInterval(() => {
                animProgress += 0.04;
                if (animProgress >= 1) {
                    animProgress = 1;
                    clearInterval(animInterval);
                    Utils.showToast(`You have arrived at ${route.destination.name}!`, 'success', 'Destination Reached');
                }

                // Interpolate current position along polyline
                const currentPos = this.interpolatePosition(route.waypoints, animProgress);
                window.EventBus.emit('navigation:progress', { pos: currentPos, progress: animProgress });
            }, 500);
        },

        /**
         * Interpolate coordinates along polyline array given 0..1 ratio
         */
        interpolatePosition(waypoints, ratio) {
            if (ratio <= 0) return waypoints[0];
            if (ratio >= 1) return waypoints[waypoints.length - 1];

            const totalSegments = waypoints.length - 1;
            const scaled = ratio * totalSegments;
            const index = Math.floor(scaled);
            const subRatio = scaled - index;

            const p1 = waypoints[index];
            const p2 = waypoints[index + 1];

            const lat = p1[0] + (p2[0] - p1[0]) * subRatio;
            const lng = p1[1] + (p2[1] - p1[1]) * subRatio;

            return [lat, lng];
        },

        /**
         * Stop / Exit navigation mode
         */
        stopNavigation() {
            isNavigating = false;
            if (animInterval) {
                clearInterval(animInterval);
                animInterval = null;
            }

            const navPanel = document.getElementById('navigation-panel');
            if (navPanel) navPanel.classList.remove('active');

            window.EventBus.emit('navigation:stopped');
            Utils.showToast('Navigation ended.', 'info');
        },

        /**
         * Render Turn-by-Turn Navigation UI Overlay
         */
        renderNavigationPanel(route) {
            const navPanel = document.getElementById('navigation-panel');
            if (!navPanel) return;

            const now = new Date();
            const etaTime = new Date(now.getTime() + route.driveTime * 60000);
            const formattedEta = etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            navPanel.innerHTML = `
                <div class="nav-header">
                    <div class="nav-eta-badge">
                        <span class="nav-eta-time">${formattedEta}</span>
                        <span class="nav-eta-label">ETA</span>
                    </div>
                    <div class="nav-route-info">
                        <h3>Heading to ${route.destination.name}</h3>
                        <div class="nav-stats">
                            <span>⏱️ ${route.driveTime} mins</span>
                            <span>•</span>
                            <span>📍 ${Utils.formatDistance(route.distance)}</span>
                            <span>•</span>
                            <span>🚶 ${route.walkTime} min walk</span>
                        </div>
                    </div>
                    <button class="nav-close-btn" onclick="NavigationModule.stopNavigation()" title="Exit Navigation">&times;</button>
                </div>

                <div class="nav-steps-container">
                    ${route.instructions.map((step, idx) => `
                        <div class="nav-step-item ${idx === 0 ? 'active' : ''}">
                            <div class="step-icon">${idx === 0 ? '🚘' : idx === route.instructions.length - 1 ? '🎯' : '📍'}</div>
                            <div class="step-details">
                                <div class="step-text">${step.text}</div>
                                ${step.subtext ? `<div class="step-subtext">${step.subtext}</div>` : ''}
                            </div>
                            <div class="step-meta">
                                <div>${step.distance}</div>
                                <div class="text-xs text-gray-400">${step.duration}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            navPanel.classList.add('active');
        }
    };
})();
