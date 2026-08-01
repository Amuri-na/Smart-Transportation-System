/**
 * Smart Transportation System - Utilities & Helpers
 * City: Addis Ababa, Ethiopia
 */

const Utils = {
    // Format minutes to readable string (e.g. "12 mins", "1 hr 5 mins")
    formatTime(minutes) {
        if (minutes < 1) return '< 1 min';
        if (minutes < 60) return `${Math.round(minutes)} mins`;
        const hrs = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr`;
    },

    // Format distance in meters or kilometers
    formatDistance(meters) {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    },

    // Get color theme based on queue wait time
    getStatusColor(waitTime) {
        if (waitTime <= 5) return { bg: '#10b981', lightBg: 'rgba(16, 185, 129, 0.15)', text: '#059669', status: 'Low Queue', level: 'green' };
        if (waitTime <= 15) return { bg: '#f59e0b', lightBg: 'rgba(245, 158, 11, 0.15)', text: '#d97706', status: 'Moderate Queue', level: 'yellow' };
        return { bg: '#ef4444', lightBg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626', status: 'Heavy Queue', level: 'red' };
    },

    // Get color theme based on congestion level (1-100)
    getCongestionColor(level) {
        if (level < 35) return { color: '#10b981', label: 'Smooth Flow' };
        if (level < 70) return { color: '#f59e0b', label: 'Moderate Traffic' };
        return { color: '#ef4444', label: 'Heavy Gridlock' };
    },

    // Confidence indicator rating (e.g. High / Medium / Low based on recency)
    getConfidenceRating(updatedMinutesAgo) {
        if (updatedMinutesAgo <= 2) return { score: 96, label: 'Very High Confidence', color: '#10b981', badge: 'Verified Live' };
        if (updatedMinutesAgo <= 5) return { score: 85, label: 'High Confidence', color: '#10b981', badge: 'Recently Updated' };
        if (updatedMinutesAgo <= 15) return { score: 68, label: 'Moderate Confidence', color: '#f59e0b', badge: 'Crowdsourced' };
        return { score: 45, label: 'Low Confidence', color: '#ef4444', badge: 'Needs Update' };
    },

    // Random number between min and max inclusive
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Pulse effect animation helper
    triggerPulse(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.classList.add('pulse-highlight');
        setTimeout(() => el.classList.remove('pulse-highlight'), 1200);
    },

    // Toast notification manager
    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-slide-in-right`;

        let iconSvg = '';
        switch (type) {
            case 'success':
                iconSvg = `<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
                break;
            case 'warning':
                iconSvg = `<svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
                break;
            case 'error':
                iconSvg = `<svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
                break;
            default:
                iconSvg = `<svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon-wrapper">${iconSvg}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    },

    // Debounce function for inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Global Event Bus for decoupled module communication
window.EventBus = {
    events: {},
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    },
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
};
