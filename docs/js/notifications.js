/**
 * Smart Transportation System - Notifications Module
 * City: Addis Ababa, Ethiopia
 */

const NotificationManager = (function() {
    let notificationsList = [
        {
            id: 'notif_1',
            type: 'queue',
            title: 'Queue Alert • Mexico Square',
            message: 'Passenger queue at Mexico Square decreased by 40%. Waiting time down to 10 mins.',
            timestamp: new Date(Date.now() - 2 * 60000),
            unread: true
        },
        {
            id: 'notif_2',
            type: 'recommendation',
            title: 'AI Smart Tip',
            message: 'High queue at Bole Terminal (24 mins). Gerji Station offers 18 mins savings!',
            timestamp: new Date(Date.now() - 10 * 60000),
            unread: true
        },
        {
            id: 'notif_3',
            type: 'traffic',
            title: 'Traffic Gridlock • Piassa',
            message: 'Heavy congestion near Piassa roundabout due to roadwork. Expect +8 min delay.',
            timestamp: new Date(Date.now() - 25 * 60000),
            unread: false
        }
    ];

    let autoSimInterval = null;

    return {
        getNotifications() {
            return notificationsList;
        },

        getUnreadCount() {
            return notificationsList.filter(n => n.unread).length;
        },

        markAllRead() {
            notificationsList.forEach(n => n.unread = false);
            this.updateBadgeCount();
        },

        addNotification(notif) {
            const newNotif = {
                id: 'notif_' + Date.now(),
                timestamp: new Date(),
                unread: true,
                ...notif
            };
            notificationsList.unshift(newNotif);

            this.updateBadgeCount();

            // Display toast banner
            Utils.showToast(newNotif.message, newNotif.type === 'traffic' ? 'warning' : 'info', newNotif.title);

            window.EventBus.emit('notification:new', newNotif);
        },

        updateBadgeCount() {
            const count = this.getUnreadCount();
            const badge = document.getElementById('notification-badge');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 9 ? '9+' : count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        },

        /**
         * Render notifications modal/dropdown
         */
        renderModal() {
            const listEl = document.getElementById('notification-modal-list');
            if (!listEl) return;

            if (notificationsList.length === 0) {
                listEl.innerHTML = `<div class="p-6 text-center text-gray-400">No notifications available</div>`;
                return;
            }

            listEl.innerHTML = notificationsList.map(n => `
                <div class="notif-item ${n.unread ? 'unread' : ''}">
                    <div class="notif-icon-box ${n.type}">
                        ${n.type === 'queue' ? '⏱️' : n.type === 'traffic' ? '🚦' : '💡'}
                    </div>
                    <div class="notif-body">
                        <div class="notif-item-title">${n.title}</div>
                        <div class="notif-item-msg">${n.message}</div>
                        <div class="notif-item-time">${this.formatTimestamp(n.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        },

        formatTimestamp(date) {
            const diffMins = Math.round((new Date() - new Date(date)) / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} mins ago`;
            return `${Math.round(diffMins / 60)} hrs ago`;
        },

        /**
         * Start auto background notification simulator
         */
        startAutoSimulation() {
            if (autoSimInterval) return;

            const realisticAlerts = [
                { type: 'queue', title: 'Mexico Terminal', message: 'Passenger queue decreasing at Mexico. 8 new minibus taxis arrived.' },
                { type: 'recommendation', title: 'Route Optimization', message: 'Bole Terminal queue spike detected. Switch to Gerji for faster boarding.' },
                { type: 'traffic', title: 'Megenagna Roundabout', message: 'Moderate traffic delay near Megenagna flyover.' },
                { type: 'queue', title: 'Sarbet Station', message: 'Sarbet queue clear! Zero wait time right now.' },
                { type: 'traffic', title: 'Gotera Interchange', message: 'Smooth traffic flow restored at Gotera interchange.' }
            ];

            autoSimInterval = setInterval(() => {
                const sample = realisticAlerts[Utils.randomInt(0, realisticAlerts.length - 1)];
                this.addNotification(sample);
            }, 25000); // Send notification every 25s
        }
    };
})();
