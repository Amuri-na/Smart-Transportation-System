/**
 * Smart Transportation System - Recommendation Engine
 * City: Addis Ababa, Ethiopia
 */

const RecommendationEngine = (function() {
    return {
        /**
         * Analyze station and generate comparison with recommended alternative
         */
        analyze(targetStationId) {
            const currentStation = StationManager.getById(targetStationId);
            if (!currentStation) return null;

            // If station already has an alternative ID, fetch it
            let altStation = null;

            if (currentStation.alternativeId) {
                altStation = StationManager.getById(currentStation.alternativeId);
            } else {
                // Find a nearby station with lower wait time
                const all = StationManager.getAll();
                const candidates = all.filter(s => 
                    s.id !== currentStation.id && 
                    s.waitTime < currentStation.waitTime - 5
                );
                
                if (candidates.length > 0) {
                    // Sort by lowest wait time
                    altStation = candidates.sort((a, b) => a.waitTime - b.waitTime)[0];
                }
            }

            // If no better alternative found or current station is already optimal
            if (!altStation || altStation.waitTime >= currentStation.waitTime) {
                return {
                    hasAlternative: false,
                    currentStation,
                    message: `${currentStation.name} is currently your optimal transportation station!`
                };
            }

            // Calculate metrics difference
            const driveTimeDiff = altStation.driveTime - currentStation.driveTime;
            const waitTimeDiff = currentStation.waitTime - altStation.waitTime;
            const netTimeSaved = waitTimeDiff - Math.max(0, driveTimeDiff);

            const distanceDiff = (altStation.distance - currentStation.distance) / 1000;

            const rationale = [
                `Queue at ${currentStation.name} has ${currentStation.queueCount} passengers with ~${currentStation.waitTime} mins wait time.`,
                `${altStation.name} is only ${altStation.driveTime} mins away and has ${altStation.availableTaxis} available taxis with ~${altStation.waitTime} mins wait time.`,
                `Heading to ${altStation.name} saves you approximately ${Math.max(1, netTimeSaved)} minutes overall!`
            ];

            return {
                hasAlternative: true,
                currentStation,
                altStation,
                netTimeSaved: Math.max(1, netTimeSaved),
                waitTimeDiff,
                driveTimeDiff: Math.max(0, driveTimeDiff),
                distanceDiff: distanceDiff.toFixed(1),
                rationale
            };
        },

        /**
         * Render recommendation UI modal / card
         */
        renderComparisonModal(targetStationId) {
            const analysis = this.analyze(targetStationId);
            if (!analysis) return;

            const modalContainer = document.getElementById('recommendation-modal-content');
            if (!modalContainer) return;

            if (!analysis.hasAlternative) {
                modalContainer.innerHTML = `
                    <div class="recommendation-header optimal">
                        <div class="header-badge">✨ Optimal Choice</div>
                        <h2>${analysis.currentStation.name} is Your Best Option!</h2>
                        <p class="subtitle">${analysis.message}</p>
                    </div>
                    <div class="optimal-card">
                        <div class="metric-group">
                            <span class="label">Wait Time</span>
                            <span class="value text-emerald-600">${analysis.currentStation.waitTime} mins</span>
                        </div>
                        <div class="metric-group">
                            <span class="label">Available Taxis</span>
                            <span class="value">${analysis.currentStation.availableTaxis} Taxis</span>
                        </div>
                        <div class="metric-group">
                            <span class="label">Congestion</span>
                            <span class="value">${analysis.currentStation.congestion}%</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary btn-block" onclick="App.navigateToStation('${analysis.currentStation.id}')">
                            Continue to ${analysis.currentStation.name}
                        </button>
                    </div>
                `;
            } else {
                const curColor = Utils.getStatusColor(analysis.currentStation.waitTime);
                const altColor = Utils.getStatusColor(analysis.altStation.waitTime);

                modalContainer.innerHTML = `
                    <div class="recommendation-header">
                        <div class="header-badge pulse">💡 AI Smart Recommendation</div>
                        <h2>Skip ${analysis.currentStation.name} & Move to ${analysis.altStation.name}!</h2>
                        <div class="savings-pill">
                            <span>Saves ~${analysis.netTimeSaved} Minutes Total</span>
                        </div>
                    </div>

                    <div class="comparison-grid">
                        <!-- Current Station Card -->
                        <div class="comparison-card current">
                            <div class="card-tag">Original Selection</div>
                            <h3>${analysis.currentStation.name}</h3>
                            <div class="subcity">${analysis.currentStation.subcity}</div>

                            <div class="metric-row">
                                <span class="lbl">Queue Wait:</span>
                                <span class="val badge-red">${analysis.currentStation.waitTime} mins</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">People Line:</span>
                                <span class="val">${analysis.currentStation.queueCount} passengers</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">Active Taxis:</span>
                                <span class="val">${analysis.currentStation.availableTaxis} ready</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">Travel Time:</span>
                                <span class="val">${analysis.currentStation.driveTime} mins</span>
                            </div>
                        </div>

                        <!-- VS Badge -->
                        <div class="vs-badge">VS</div>

                        <!-- Recommended Alternative Card -->
                        <div class="comparison-card recommended">
                            <div class="card-tag recommended-tag">✨ Recommended Alternative</div>
                            <h3>${analysis.altStation.name}</h3>
                            <div class="subcity">${analysis.altStation.subcity}</div>

                            <div class="metric-row">
                                <span class="lbl">Queue Wait:</span>
                                <span class="val badge-green">${analysis.altStation.waitTime} mins</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">People Line:</span>
                                <span class="val">${analysis.altStation.queueCount} passengers</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">Active Taxis:</span>
                                <span class="val text-emerald-600 font-bold">${analysis.altStation.availableTaxis} ready</span>
                            </div>
                            <div class="metric-row">
                                <span class="lbl">Travel Time:</span>
                                <span class="val">${analysis.altStation.driveTime} mins</span>
                            </div>
                        </div>
                    </div>

                    <div class="recommendation-reasons">
                        <h4>Why this recommendation?</h4>
                        <ul>
                            ${analysis.rationale.map(r => `<li><span class="check-icon">✓</span> ${r}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="modal-actions gap-3">
                        <button class="btn btn-secondary" onclick="App.closeRecommendationModal(); App.selectStation('${analysis.currentStation.id}')">
                            Keep ${analysis.currentStation.name}
                        </button>
                        <button class="btn btn-primary" onclick="App.acceptRecommendation('${analysis.altStation.id}')">
                            Accept & Navigate to ${analysis.altStation.name}
                        </button>
                    </div>
                `;
            }

            // Show modal
            document.getElementById('recommendation-modal').classList.add('active');
        }
    };
})();
