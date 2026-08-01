/**
 * Smart Transportation System - Queue Reporting Module
 * City: Addis Ababa, Ethiopia
 */

const QueueReportModule = (function() {
    let currentSelectedStationId = null;

    return {
        /**
         * Open Queue Report Modal for a specific station
         */
        openModal(stationId) {
            currentSelectedStationId = stationId || 'st_bole';
            const station = StationManager.getById(currentSelectedStationId);
            if (!station) return;

            const modal = document.getElementById('queue-report-modal');
            const stationTitle = document.getElementById('queue-modal-station-name');
            const currentWaitEl = document.getElementById('queue-modal-current-wait');

            if (stationTitle) stationTitle.textContent = `${station.name} (${station.amharicName})`;
            if (currentWaitEl) currentWaitEl.textContent = `${station.waitTime} mins current wait`;

            // Reset form selections
            const options = document.querySelectorAll('.queue-option-card');
            options.forEach(opt => opt.classList.remove('selected'));

            // Default selection based on current station wait
            let defaultOption = 'medium';
            if (station.waitTime <= 5) defaultOption = 'very_short';
            else if (station.waitTime <= 10) defaultOption = 'short';
            else if (station.waitTime <= 25) defaultOption = 'medium';
            else if (station.waitTime <= 35) defaultOption = 'long';
            else defaultOption = 'very_long';

            const defaultCard = document.querySelector(`.queue-option-card[data-level="${defaultOption}"]`);
            if (defaultCard) defaultCard.classList.add('selected');

            // Reset taxi input
            const taxiInput = document.getElementById('report-taxi-count');
            if (taxiInput) taxiInput.value = station.availableTaxis;

            // Reset congestion slider
            const congestionInput = document.getElementById('report-congestion-slider');
            const congestionVal = document.getElementById('report-congestion-val');
            if (congestionInput) {
                congestionInput.value = station.congestion;
                if (congestionVal) congestionVal.textContent = `${station.congestion}%`;
            }

            modal.classList.add('active');
        },

        /**
         * Close Queue Report Modal
         */
        closeModal() {
            const modal = document.getElementById('queue-report-modal');
            if (modal) modal.classList.remove('active');
        },

        /**
         * Handle selection of queue level option
         */
        selectOption(cardElement) {
            const options = document.querySelectorAll('.queue-option-card');
            options.forEach(opt => opt.classList.remove('selected'));
            cardElement.classList.add('selected');
        },

        /**
         * Submit Queue Report
         */
        submitReport() {
            if (!currentSelectedStationId) return;

            const selectedCard = document.querySelector('.queue-option-card.selected');
            if (!selectedCard) {
                Utils.showToast('Please select a queue length option.', 'warning', 'Input Required');
                return;
            }

            const queueLevel = selectedCard.getAttribute('data-level');
            const taxiCount = parseInt(document.getElementById('report-taxi-count')?.value || '5', 10);
            const congestion = parseInt(document.getElementById('report-congestion-slider')?.value || '50', 10);

            // Update state
            const success = StationManager.reportQueue(currentSelectedStationId, queueLevel, taxiCount, congestion);

            if (success) {
                const station = StationManager.getById(currentSelectedStationId);
                
                // Show success feedback
                Utils.showToast(
                    `Thank you! Community data for ${station.name} updated successfully. +15 Karma points earned!`,
                    'success',
                    'Queue Report Submitted'
                );

                this.closeModal();

                // Trigger pulse effect on station view if visible
                Utils.triggerPulse('station-detail-card');
            }
        }
    };
})();
