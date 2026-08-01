/**
 * Smart Transportation System - Station Data & Management
 * City: Addis Ababa, Ethiopia
 */

const StationManager = (function() {
    // 12 Realistic Addis Ababa Transit Hubs & Minibus Taxi Terminals
    let stations = [
        {
            id: 'st_bole',
            name: 'Bole Terminal',
            amharicName: 'ቦሌ ታክሲ ተርሚናል',
            subcity: 'Bole Subcity',
            lat: 9.0015,
            lng: 38.7845,
            queueCount: 42,
            availableTaxis: 3,
            waitTime: 24,
            minWait: 18,
            maxWait: 32,
            congestion: 82, // %
            distance: 3800, // meters from user
            walkTime: 45, // mins
            driveTime: 14, // mins
            isRecommended: false,
            alternativeId: 'st_gerji',
            alternativeReason: 'Gerji is 5 mins away with 85% shorter queue (save 18 mins).',
            isFavorite: false,
            transportTypes: ['Minibus', 'Ride Hailing', 'Express Bus'],
            lastUpdated: new Date()
        },
        {
            id: 'st_gerji',
            name: 'Gerji Station',
            amharicName: 'ገርጂ ታክሲ ተርሚናል',
            subcity: 'Bole Subcity',
            lat: 9.0080,
            lng: 38.7980,
            queueCount: 6,
            availableTaxis: 12,
            waitTime: 4,
            minWait: 2,
            maxWait: 8,
            congestion: 28,
            distance: 4600,
            walkTime: 52,
            driveTime: 16,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Optimal choice: High taxi availability & low queue.',
            isFavorite: true,
            transportTypes: ['Minibus', 'Ride Hailing'],
            lastUpdated: new Date()
        },
        {
            id: 'st_mexico',
            name: 'Mexico Square Hub',
            amharicName: 'ሜክሲኮ አደባባይ',
            subcity: 'Lideta Subcity',
            lat: 9.0102,
            lng: 38.7448,
            queueCount: 28,
            availableTaxis: 7,
            waitTime: 14,
            minWait: 10,
            maxWait: 20,
            congestion: 65,
            distance: 1200,
            walkTime: 15,
            driveTime: 5,
            isRecommended: false,
            alternativeId: 'st_torhailoch',
            alternativeReason: 'Tor Hailoch has faster passenger flow right now.',
            isFavorite: false,
            transportTypes: ['Minibus', 'LRT Train', 'Ride Hailing'],
            lastUpdated: new Date()
        },
        {
            id: 'st_megenagna',
            name: 'Megenagna Terminal',
            amharicName: 'መገናኛ ታክሲ ተርሚናል',
            subcity: 'Yeka Subcity',
            lat: 9.0185,
            lng: 38.7995,
            queueCount: 58,
            availableTaxis: 2,
            waitTime: 32,
            minWait: 25,
            maxWait: 45,
            congestion: 94,
            distance: 5100,
            walkTime: 60,
            driveTime: 20,
            isRecommended: false,
            alternativeId: 'st_cmc',
            alternativeReason: 'CMC Terminal has 40+ waiting taxis ready.',
            isFavorite: false,
            transportTypes: ['Minibus', 'Express Bus', 'LRT Train'],
            lastUpdated: new Date()
        },
        {
            id: 'st_piassa',
            name: 'Piassa Hub',
            amharicName: 'ፒያሳ ታክሲ ተርሚናል',
            subcity: 'Arada Subcity',
            lat: 9.0350,
            lng: 38.7520,
            queueCount: 19,
            availableTaxis: 8,
            waitTime: 11,
            minWait: 8,
            maxWait: 16,
            congestion: 48,
            distance: 2900,
            walkTime: 35,
            driveTime: 10,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Steady taxi arrivals, steady queue movement.',
            isFavorite: true,
            transportTypes: ['Minibus', 'Anbessa Bus'],
            lastUpdated: new Date()
        },
        {
            id: 'st_sarbet',
            name: 'Sarbet Station',
            amharicName: 'ሳር ቤት ታክሲ ተርሚናል',
            subcity: 'Nifas Silk-Lafto',
            lat: 8.9950,
            lng: 38.7360,
            queueCount: 8,
            availableTaxis: 14,
            waitTime: 5,
            minWait: 3,
            maxWait: 9,
            congestion: 30,
            distance: 3100,
            walkTime: 38,
            driveTime: 9,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Fast turnaround time & plenty of taxis.',
            isFavorite: false,
            transportTypes: ['Minibus', 'Ride Hailing'],
            lastUpdated: new Date()
        },
        {
            id: 'st_cmc',
            name: 'CMC Terminal',
            amharicName: 'ሲኤምሲ ታክሲ ተርሚናል',
            subcity: 'Yeka Subcity',
            lat: 9.0220,
            lng: 38.8250,
            queueCount: 11,
            availableTaxis: 15,
            waitTime: 6,
            minWait: 4,
            maxWait: 10,
            congestion: 35,
            distance: 7800,
            walkTime: 90,
            driveTime: 22,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Very fast boarding, minimal queue.',
            isFavorite: false,
            transportTypes: ['Minibus', 'LRT Train'],
            lastUpdated: new Date()
        },
        {
            id: 'st_ayat',
            name: 'Ayat Terminal',
            amharicName: 'አያት ታክሲ ተርሚናል',
            subcity: 'Yeka Subcity',
            lat: 9.0290,
            lng: 38.8510,
            queueCount: 22,
            availableTaxis: 9,
            waitTime: 13,
            minWait: 9,
            maxWait: 18,
            congestion: 50,
            distance: 10400,
            walkTime: 120,
            driveTime: 28,
            isRecommended: false,
            alternativeId: 'st_cmc',
            alternativeReason: 'Take CMC LRT to bypass traffic.',
            isFavorite: false,
            transportTypes: ['Minibus', 'LRT Train', 'Sheger Bus'],
            lastUpdated: new Date()
        },
        {
            id: 'st_lebu',
            name: 'Lebu Hub',
            amharicName: 'ለቡ ታክሲ ተርሚናል',
            subcity: 'Nifas Silk-Lafto',
            lat: 8.9630,
            lng: 38.7180,
            queueCount: 5,
            availableTaxis: 16,
            waitTime: 3,
            minWait: 1,
            maxWait: 6,
            congestion: 20,
            distance: 6200,
            walkTime: 75,
            driveTime: 17,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Exceptional flow, no waiting line.',
            isFavorite: false,
            transportTypes: ['Minibus', 'Ride Hailing'],
            lastUpdated: new Date()
        },
        {
            id: 'st_torhailoch',
            name: 'Tor Hailoch Hub',
            amharicName: 'ጦር ኃይሎች ተርሚናል',
            subcity: 'Kolfe Keraniyo',
            lat: 9.0170,
            lng: 38.7250,
            queueCount: 16,
            availableTaxis: 11,
            waitTime: 8,
            minWait: 5,
            maxWait: 12,
            congestion: 42,
            distance: 2400,
            walkTime: 28,
            driveTime: 7,
            isRecommended: true,
            alternativeId: null,
            alternativeReason: 'Good option near Ring Road connection.',
            isFavorite: true,
            transportTypes: ['Minibus', 'LRT Train'],
            lastUpdated: new Date()
        },
        {
            id: 'st_gotera',
            name: 'Gotera Interchange',
            amharicName: 'ጎተራ አደባባይ ታክሲ',
            subcity: 'Kirkos Subcity',
            lat: 8.9890,
            lng: 38.7580,
            queueCount: 31,
            availableTaxis: 5,
            waitTime: 17,
            minWait: 12,
            maxWait: 25,
            congestion: 75,
            distance: 2100,
            walkTime: 24,
            driveTime: 6,
            isRecommended: false,
            alternativeId: 'st_sarbet',
            alternativeReason: 'Sarbet has 60% lower queue time right now.',
            isFavorite: false,
            transportTypes: ['Minibus', 'Ride Hailing'],
            lastUpdated: new Date()
        },
        {
            id: 'st_stadium',
            name: 'Stadium Terminal',
            amharicName: 'ስታዲየም ታክሲ ተርሚናል',
            subcity: 'Kirkos Subcity',
            lat: 9.0130,
            lng: 38.7570,
            queueCount: 25,
            availableTaxis: 6,
            waitTime: 15,
            minWait: 10,
            maxWait: 22,
            congestion: 60,
            distance: 800,
            walkTime: 10,
            driveTime: 3,
            isRecommended: false,
            alternativeId: 'st_mexico',
            alternativeReason: 'Walk 5 mins to Mexico for more vehicle frequency.',
            isFavorite: false,
            transportTypes: ['Minibus', 'Anbessa Bus', 'LRT Train'],
            lastUpdated: new Date()
        }
    ];

    // Live update interval reference
    let liveUpdateInterval = null;

    return {
        // Return all stations
        getAll() {
            return stations;
        },

        // Get single station by ID
        getById(id) {
            return stations.find(s => s.id === id);
        },

        // Search stations by keyword (name or subcity)
        search(query) {
            if (!query || query.trim() === '') return stations;
            const q = query.toLowerCase().trim();
            return stations.filter(s => 
                s.name.toLowerCase().includes(q) || 
                s.amharicName.includes(q) || 
                s.subcity.toLowerCase().includes(q)
            );
        },

        // Filter by queue status ('green', 'yellow', 'red')
        filterByStatus(statusLevel) {
            if (!statusLevel || statusLevel === 'all') return stations;
            return stations.filter(s => {
                const color = Utils.getStatusColor(s.waitTime);
                return color.level === statusLevel;
            });
        },

        // Get top recommended station
        getRecommendedStation() {
            // Find station with lowest wait time that is marked recommended
            const recommended = stations.filter(s => s.isRecommended);
            return recommended.sort((a, b) => a.waitTime - b.waitTime)[0] || stations[0];
        },

        // Get nearby stations sorted by distance
        getNearby(limit = 4) {
            return [...stations].sort((a, b) => a.distance - b.distance).slice(0, limit);
        },

        // Update a station queue manually from user queue report
        reportQueue(stationId, queueLevel, customTaxiCount = null, congestion = null) {
            const station = this.getById(stationId);
            if (!station) return false;

            let newWait = station.waitTime;
            let newQueue = station.queueCount;

            switch (queueLevel) {
                case 'very_short':
                    newQueue = Utils.randomInt(1, 4);
                    newWait = Utils.randomInt(1, 4);
                    break;
                case 'short':
                    newQueue = Utils.randomInt(5, 12);
                    newWait = Utils.randomInt(5, 9);
                    break;
                case 'medium':
                    newQueue = Utils.randomInt(14, 25);
                    newWait = Utils.randomInt(10, 16);
                    break;
                case 'long':
                    newQueue = Utils.randomInt(28, 42);
                    newWait = Utils.randomInt(18, 26);
                    break;
                case 'very_long':
                    newQueue = Utils.randomInt(45, 65);
                    newWait = Utils.randomInt(28, 45);
                    break;
            }

            station.queueCount = newQueue;
            station.waitTime = newWait;
            station.minWait = Math.max(1, newWait - Utils.randomInt(2, 4));
            station.maxWait = newWait + Utils.randomInt(4, 10);
            
            if (customTaxiCount !== null) {
                station.availableTaxis = customTaxiCount;
            }
            if (congestion !== null) {
                station.congestion = congestion;
            }

            station.lastUpdated = new Date();

            // Re-evaluate recommendations
            station.isRecommended = station.waitTime <= 8 && station.availableTaxis >= 8;

            // Emit live event
            window.EventBus.emit('station:updated', { station, source: 'user_report' });
            return true;
        },

        // Toggle favorite status
        toggleFavorite(stationId) {
            const station = this.getById(stationId);
            if (station) {
                station.isFavorite = !station.isFavorite;
                window.EventBus.emit('station:favorite_toggled', station);
                return station.isFavorite;
            }
            return false;
        },

        // Start 5-second dynamic updates engine
        startLiveUpdates() {
            if (liveUpdateInterval) return;

            liveUpdateInterval = setInterval(() => {
                // Randomly pick 1 to 3 stations to update
                const countToUpdate = Utils.randomInt(1, 3);
                const updatedStations = [];

                for (let i = 0; i < countToUpdate; i++) {
                    const randomIndex = Utils.randomInt(0, stations.length - 1);
                    const station = stations[randomIndex];

                    // Small delta changes
                    const queueDelta = Utils.randomInt(-3, 3);
                    const taxiDelta = Utils.randomInt(-2, 2);
                    const congestionDelta = Utils.randomInt(-4, 4);

                    station.queueCount = Math.max(0, station.queueCount + queueDelta);
                    station.availableTaxis = Math.max(0, station.availableTaxis + taxiDelta);
                    station.congestion = Math.min(100, Math.max(10, station.congestion + congestionDelta));

                    // Recalculate estimated wait time based on queue / taxis ratio
                    const taxiRate = Math.max(1, station.availableTaxis);
                    const calculatedWait = Math.round((station.queueCount / (taxiRate * 0.8)) * 2);
                    station.waitTime = Math.min(60, Math.max(1, calculatedWait));
                    station.minWait = Math.max(1, station.waitTime - Utils.randomInt(1, 3));
                    station.maxWait = station.waitTime + Utils.randomInt(3, 7);

                    station.lastUpdated = new Date();
                    updatedStations.push(station);
                }

                if (updatedStations.length > 0) {
                    window.EventBus.emit('stations:live_batch_updated', updatedStations);
                }
            }, 5000);
        },

        // Stop live updates engine
        stopLiveUpdates() {
            if (liveUpdateInterval) {
                clearInterval(liveUpdateInterval);
                liveUpdateInterval = null;
            }
        }
    };
})();
