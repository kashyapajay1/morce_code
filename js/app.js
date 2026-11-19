// Morse Academy — Application Entry Point
// Initializes core subsystems: Theme, State, Navigation, Audio, and Router

import './state.js';
import './morse-engine.js';
import './audio.js';
import './api.js';
import { ThemeManager } from './theme.js';
import { initNavigation } from './components/navigation.js';
import './components/toast.js';
import './components/modal.js';
import './components/progress-bar.js';
import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme
    ThemeManager.init();

    // 2. Initialize Navigation
    const sidebarEl = document.getElementById('sidebar');
    initNavigation(sidebarEl);

    // 3. User Gesture listener to unlock Web Audio AudioContext
    const unlockAudio = () => {
        if (window.MorseAudio) {
            window.MorseAudio.init();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    // 4. Initialize Router
    Router.init();

    // 5. Register Service Worker if supported
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            console.debug('ServiceWorker registration skipped or failed:', err);
        });
    }
});
