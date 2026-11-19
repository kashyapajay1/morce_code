// Morse Academy — State Management Module
// LocalStorage Persistence with Pub/Sub Event System

const DEFAULT_SETTINGS = {
    theme: 'dark',
    wpm: 15,
    farnsworthWpm: 10,
    frequency: 600,       // Hz
    volume: 0.7,          // 0-1
    difficulty: 'normal', // easy/normal/hard
    keyBinding: 'space',
    handedness: 'right',
    soundFeedback: true,
    testDuration: 60,     // seconds
    passingThreshold: 85  // percent
};

const DEFAULT_PROGRESS = {
    currentLevel: 1,
    completedLevels: [],
    scores: {},
    achievements: []
};

const DEFAULT_STATS = {
    totalTime: 0,
    sessions: 0,
    highestWpm: 0,
    charPerformance: {},
    history: [],
    streak: 0,
    lastPracticeDate: null
};

class StateManager {
    constructor() {
        this._listeners = new Map();
    }

    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.error(`Error reading key "${key}" from localStorage:`, e);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this._notify(key, value);
        } catch (e) {
            console.error(`Error writing key "${key}" to localStorage:`, e);
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            this._notify(key, null);
        } catch (e) {
            console.error(`Error removing key "${key}" from localStorage:`, e);
        }
    }

    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }
        this._listeners.get(key).add(callback);

        return () => {
            const set = this._listeners.get(key);
            if (set) {
                set.delete(callback);
                if (set.size === 0) {
                    this._listeners.delete(key);
                }
            }
        };
    }

    _notify(key, value) {
        const set = this._listeners.get(key);
        if (set) {
            set.forEach(cb => {
                try {
                    cb(value);
                } catch (err) {
                    console.error(`Error in state subscriber for "${key}":`, err);
                }
            });
        }
        if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
            window.dispatchEvent(new CustomEvent('appstate:change', {
                detail: { key, value }
            }));
        }
    }

    // Convenience Getters / Setters
    getProgress() {
        const saved = this.get('morseProgress', {});
        return { ...DEFAULT_PROGRESS, ...saved };
    }

    setProgress(progress) {
        const current = this.getProgress();
        const updated = { ...current, ...progress };
        this.set('morseProgress', updated);
        return updated;
    }

    getSettings() {
        const saved = this.get('morseSettings', {});
        return { ...DEFAULT_SETTINGS, ...saved };
    }

    setSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        this.set('morseSettings', updated);
        return updated;
    }

    getStats() {
        const saved = this.get('morseStats', {});
        return { ...DEFAULT_STATS, ...saved };
    }

    updateStats(partial) {
        const current = this.getStats();
        const updated = {
            ...current,
            ...partial,
            charPerformance: {
                ...current.charPerformance,
                ...(partial.charPerformance || {})
            },
            history: partial.history
                ? [...current.history, ...partial.history]
                : current.history
        };
        this.set('morseStats', updated);
        return updated;
    }
}

export const AppState = new StateManager();
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}
