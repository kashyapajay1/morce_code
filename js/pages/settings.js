// Morse Academy — Settings Page
// User preferences: Appearance, Audio synthesis, Farnsworth speed, Practice difficulty, Key bindings & Data backup

let containerRef = null;
let saveDebounce = null;

function getSettings() {
    return window.AppState ? window.AppState.getSettings() : {
        theme: 'dark',
        wpm: 15,
        farnsworthWpm: 10,
        frequency: 600,
        volume: 0.7,
        difficulty: 'normal',
        keyBinding: 'space',
        handedness: 'right',
        soundFeedback: true,
        testDuration: 60,
        passingThreshold: 85
    };
}

function renderSettingsHTML() {
    const s = getSettings();
    const currentTheme = document.documentElement.getAttribute('data-theme') || s.theme || 'dark';

    return `
    <div class="ma-page ma-fade-in" style="max-width: 900px; margin: 0 auto;">
        <header class="ma-page__header">
            <h1 class="ma-h1">Settings & Preferences</h1>
            <p class="ma-text ma-text--muted">Configure tone acoustics, keying mechanics, speed curves, and backup your learning data.</p>
        </header>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- 1. Appearance Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">🎨 Appearance & Theme</h2>
                </div>
                <div class="ma-card__body">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <strong style="font-size: 1.05rem;">Interface Theme</strong>
                            <p class="ma-text ma-text--muted" style="font-size: 0.9rem; margin-top: 0.25rem;">
                                Select between high-contrast dark radio operator console and crisp light daylight view.
                            </p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span class="ma-badge ${currentTheme === 'dark' ? 'ma-badge--info' : 'ma-badge--warning'}">
                                ${currentTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                            </span>
                            <button id="set-btn-theme-toggle" class="ma-btn ma-btn--secondary">
                                Toggle Theme
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. Audio Acoustics Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">🔊 Audio & Tone Synthesis</h2>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 1.5rem;">
                        <!-- Tone Frequency (Pitch) -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                                <label class="ma-label" for="set-input-freq">CW Sidetone Pitch (Frequency)</label>
                                <span id="set-freq-display" style="font-weight: 700; color: var(--accent-cyan);">${s.frequency} Hz</span>
                            </div>
                            <input type="range" id="set-input-freq" class="ma-range" min="400" max="1000" step="25" value="${s.frequency}" style="width: 100%;">
                            <span class="ma-text--muted" style="font-size: 0.8rem;">Standard ham CW pitch is 550–700 Hz</span>
                        </div>

                        <!-- Master Volume -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                                <label class="ma-label" for="set-input-vol">Master Volume</label>
                                <span id="set-vol-display" style="font-weight: 700; color: var(--accent-amber);">${Math.round(s.volume * 100)}%</span>
                            </div>
                            <input type="range" id="set-input-vol" class="ma-range" min="0" max="100" step="5" value="${Math.round(s.volume * 100)}" style="width: 100%;">
                            <span class="ma-text--muted" style="font-size: 0.8rem;">Adjust headphone level comfortably</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.25rem;">
                        <div>
                            <strong style="font-size: 0.95rem;">Auditory Test</strong>
                            <p class="ma-text ma-text--muted" style="font-size: 0.85rem;">Play a short test burst to verify tone pitch and volume.</p>
                        </div>
                        <button id="set-btn-test-tone" class="ma-btn ma-btn--primary">
                            <span>🔊 Test Tone (1s)</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 3. Speed & Farnsworth Timing Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">⚡ Speed & Farnsworth Timing</h2>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 1.25rem;">
                        <!-- Character Speed (WPM) -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                                <label class="ma-label" for="set-input-wpm">Character Speed (PARIS standard)</label>
                                <span id="set-wpm-display" style="font-weight: 700; color: var(--accent-cyan);">${s.wpm} WPM</span>
                            </div>
                            <input type="range" id="set-input-wpm" class="ma-range" min="5" max="40" step="1" value="${s.wpm}" style="width: 100%;">
                            <span class="ma-text--muted" style="font-size: 0.8rem;">Internal speed of individual dots and dashes</span>
                        </div>

                        <!-- Farnsworth WPM -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                                <label class="ma-label" for="set-input-fwpm">Effective (Farnsworth) Speed</label>
                                <span id="set-fwpm-display" style="font-weight: 700; color: var(--accent-amber);">${s.farnsworthWpm} WPM</span>
                            </div>
                            <input type="range" id="set-input-fwpm" class="ma-range" min="5" max="40" step="1" value="${s.farnsworthWpm}" style="width: 100%;">
                            <span class="ma-text--muted" style="font-size: 0.8rem;">Overall transmission speed including inter-character gaps</span>
                        </div>
                    </div>

                    <!-- Farnsworth Explanation Banner -->
                    <div style="background: var(--bg-secondary); border-radius: var(--border-radius-sm); border-left: 4px solid var(--accent-cyan); padding: 0.9rem 1rem;">
                        <strong style="color: var(--accent-cyan); font-size: 0.9rem;">💡 Why Farnsworth Spacing matters:</strong>
                        <p class="ma-text ma-text--muted" style="font-size: 0.85rem; margin-top: 0.25rem;">
                            Keeping individual characters at a higher speed (e.g. 15–20 WPM) while adding extra pauses between letters trains your auditory cortex to recognize the whole rhythm pattern as a single unit, eliminating the bad habit of counting individual dits and dahs.
                        </p>
                    </div>
                </div>
            </div>

            <!-- 4. Practice & Examination Settings Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">🎯 Practice & Examination Criteria</h2>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--3col" style="gap: 1.25rem;">
                        <!-- Difficulty -->
                        <div>
                            <label class="ma-label" for="set-select-diff">Practice Difficulty</label>
                            <select id="set-select-diff" class="ma-select" style="width: 100%;">
                                <option value="easy" ${s.difficulty === 'easy' ? 'selected' : ''}>Easy (Larger gaps, lenient)</option>
                                <option value="normal" ${s.difficulty === 'normal' ? 'selected' : ''}>Normal (Balanced standard)</option>
                                <option value="hard" ${s.difficulty === 'hard' ? 'selected' : ''}>Hard (Strict timing, fast)</option>
                            </select>
                        </div>

                        <!-- Test Duration -->
                        <div>
                            <label class="ma-label" for="set-select-duration">Timed Test Duration</label>
                            <select id="set-select-duration" class="ma-select" style="width: 100%;">
                                <option value="30" ${s.testDuration === 30 ? 'selected' : ''}>30 Seconds (Quick Sprint)</option>
                                <option value="60" ${s.testDuration === 60 ? 'selected' : ''}>60 Seconds (Standard 1 Min)</option>
                                <option value="120" ${s.testDuration === 120 ? 'selected' : ''}>120 Seconds (2 Minutes)</option>
                                <option value="300" ${s.testDuration === 300 ? 'selected' : ''}>300 Seconds (5 Min Endurance)</option>
                            </select>
                        </div>

                        <!-- Passing Threshold -->
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                                <label class="ma-label" for="set-input-threshold" style="margin: 0;">Passing Threshold</label>
                                <span id="set-threshold-display" style="font-weight: 700; color: var(--accent-green);">${s.passingThreshold || 85}%</span>
                            </div>
                            <input type="range" id="set-input-threshold" class="ma-range" min="50" max="100" step="5" value="${s.passingThreshold || 85}" style="width: 100%;">
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. Input Controls & Hardware Keying Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">⌨️ Input Controls & Keying</h2>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--3col" style="gap: 1.25rem; align-items: center;">
                        <!-- Key Binding -->
                        <div>
                            <label class="ma-label" for="set-select-key">Sending Key Binding</label>
                            <select id="set-select-key" class="ma-select" style="width: 100%;">
                                <option value="space" ${s.keyBinding === 'space' ? 'selected' : ''}>Spacebar (Recommended)</option>
                                <option value="enter" ${s.keyBinding === 'enter' ? 'selected' : ''}>Enter Key</option>
                                <option value="mouse" ${s.keyBinding === 'mouse' ? 'selected' : ''}>Mouse Button / Touch Only</option>
                            </select>
                        </div>

                        <!-- Handedness -->
                        <div>
                            <label class="ma-label" for="set-select-hand">Paddle Handedness</label>
                            <select id="set-select-hand" class="ma-select" style="width: 100%;">
                                <option value="right" ${s.handedness === 'right' ? 'selected' : ''}>Right-Handed (Left=Dit, Right=Dah)</option>
                                <option value="left" ${s.handedness === 'left' ? 'selected' : ''}>Left-Handed (Right=Dit, Left=Dah)</option>
                            </select>
                        </div>

                        <!-- Sound Feedback Toggle -->
                        <div style="display: flex; flex-direction: column; justify-content: center;">
                            <label class="ma-label" style="margin-bottom: 0.5rem;">Sound Feedback</label>
                            <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;">
                                <input type="checkbox" id="set-check-sound" ${s.soundFeedback ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-cyan);">
                                <span style="font-size: 0.95rem;">Enable sidetone when keying</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 6. Data Management Card -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">💾 Data Management & Backup</h2>
                </div>
                <div class="ma-card__body">
                    <p class="ma-text ma-text--muted" style="margin-bottom: 1.5rem;">
                        Your progress, exam scores, character mastery statistics, and preferences are stored securely in your browser. You can export a backup JSON file or restore on another device.
                    </p>

                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
                        <button id="set-btn-export" class="ma-btn ma-btn--primary">
                            <span>📥 Export All Data (JSON)</span>
                        </button>

                        <label class="ma-btn ma-btn--secondary" style="cursor: pointer; margin: 0;">
                            <span>📤 Import Backup</span>
                            <input type="file" id="set-file-import" accept=".json,application/json" style="display: none;">
                        </label>

                        <button id="set-btn-reset-stats" class="ma-btn ma-btn--ghost" style="border: 1px solid var(--border-color);">
                            <span>Reset Statistics</span>
                        </button>

                        <button id="set-btn-reset-progress" class="ma-btn ma-btn--danger">
                            <span>⚠️ Reset All Progress</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

function saveCurrentSettings(partialSettings = {}) {
    if (!window.AppState) return;
    const current = getSettings();
    const updated = { ...current, ...partialSettings };
    window.AppState.setSettings(updated);

    // Sync Audio Engine values
    if (window.MorseAudio) {
        if (updated.volume !== undefined) window.MorseAudio.setVolume(updated.volume);
        if (updated.frequency !== undefined) window.MorseAudio.setFrequency(updated.frequency);
    }

    // Attempt backend sync
    if (window.MorseAPI) {
        window.MorseAPI.put('/settings', updated).catch(() => {});
    }

    if (window.Toast) {
        clearTimeout(saveDebounce);
        saveDebounce = setTimeout(() => {
            window.Toast.success('Settings auto-saved');
        }, 500);
    }
}

function bindSettingsEvents() {
    if (!containerRef) return;

    // Theme toggle
    const themeBtn = containerRef.querySelector('#set-btn-theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            if (window.ThemeManager) {
                const next = window.ThemeManager.toggle();
                saveCurrentSettings({ theme: next });
            } else {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                saveCurrentSettings({ theme: next });
            }
            render(containerRef);
        });
    }

    // Audio frequency slider
    const freqSlider = containerRef.querySelector('#set-input-freq');
    const freqDisplay = containerRef.querySelector('#set-freq-display');
    if (freqSlider && freqDisplay) {
        freqSlider.addEventListener('input', () => {
            const val = parseInt(freqSlider.value, 10);
            freqDisplay.textContent = `${val} Hz`;
            saveCurrentSettings({ frequency: val });
        });
    }

    // Volume slider
    const volSlider = containerRef.querySelector('#set-input-vol');
    const volDisplay = containerRef.querySelector('#set-vol-display');
    if (volSlider && volDisplay) {
        volSlider.addEventListener('input', () => {
            const val = parseInt(volSlider.value, 10);
            volDisplay.textContent = `${val}%`;
            saveCurrentSettings({ volume: val / 100 });
        });
    }

    // Test Tone button
    const testToneBtn = containerRef.querySelector('#set-btn-test-tone');
    if (testToneBtn) {
        testToneBtn.addEventListener('click', () => {
            if (window.MorseAudio) {
                window.MorseAudio.init();
                const settings = getSettings();
                window.MorseAudio.playMorse('... --- ...', {
                    wpm: settings.wpm || 15,
                    frequency: settings.frequency || 600,
                    volume: settings.volume !== undefined ? settings.volume : 0.7
                });
            }
        });
    }

    // WPM slider
    const wpmSlider = containerRef.querySelector('#set-input-wpm');
    const wpmDisplay = containerRef.querySelector('#set-wpm-display');
    if (wpmSlider && wpmDisplay) {
        wpmSlider.addEventListener('input', () => {
            const val = parseInt(wpmSlider.value, 10);
            wpmDisplay.textContent = `${val} WPM`;
            saveCurrentSettings({ wpm: val });
        });
    }

    // Farnsworth WPM slider
    const fwpmSlider = containerRef.querySelector('#set-input-fwpm');
    const fwpmDisplay = containerRef.querySelector('#set-fwpm-display');
    if (fwpmSlider && fwpmDisplay) {
        fwpmSlider.addEventListener('input', () => {
            const val = parseInt(fwpmSlider.value, 10);
            fwpmDisplay.textContent = `${val} WPM`;
            saveCurrentSettings({ farnsworthWpm: val });
        });
    }

    // Passing threshold slider
    const threshSlider = containerRef.querySelector('#set-input-threshold');
    const threshDisplay = containerRef.querySelector('#set-threshold-display');
    if (threshSlider && threshDisplay) {
        threshSlider.addEventListener('input', () => {
            const val = parseInt(threshSlider.value, 10);
            threshDisplay.textContent = `${val}%`;
            saveCurrentSettings({ passingThreshold: val });
        });
    }

    // Selects: difficulty, duration, keyBinding, handedness, soundFeedback
    const diffSelect = containerRef.querySelector('#set-select-diff');
    if (diffSelect) {
        diffSelect.addEventListener('change', () => {
            saveCurrentSettings({ difficulty: diffSelect.value });
        });
    }

    const durSelect = containerRef.querySelector('#set-select-duration');
    if (durSelect) {
        durSelect.addEventListener('change', () => {
            saveCurrentSettings({ testDuration: parseInt(durSelect.value, 10) });
        });
    }

    const keySelect = containerRef.querySelector('#set-select-key');
    if (keySelect) {
        keySelect.addEventListener('change', () => {
            saveCurrentSettings({ keyBinding: keySelect.value });
        });
    }

    const handSelect = containerRef.querySelector('#set-select-hand');
    if (handSelect) {
        handSelect.addEventListener('change', () => {
            saveCurrentSettings({ handedness: handSelect.value });
        });
    }

    const soundCheck = containerRef.querySelector('#set-check-sound');
    if (soundCheck) {
        soundCheck.addEventListener('change', () => {
            saveCurrentSettings({ soundFeedback: soundCheck.checked });
        });
    }

    // Data export button
    const exportBtn = containerRef.querySelector('#set-btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                app: 'Morse Academy',
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                progress: window.AppState ? window.AppState.getProgress() : {},
                stats: window.AppState ? window.AppState.getStats() : {},
                settings: getSettings()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `morse-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (window.Toast) window.Toast.success('Progress backup exported successfully');
        });
    }

    // Data import file input
    const importInput = containerRef.querySelector('#set-file-import');
    if (importInput) {
        importInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (parsed.progress && window.AppState) {
                        window.AppState.setProgress(parsed.progress);
                    }
                    if (parsed.stats && window.AppState) {
                        window.AppState.updateStats(parsed.stats);
                    }
                    if (parsed.settings && window.AppState) {
                        window.AppState.setSettings(parsed.settings);
                    }
                    if (window.Toast) window.Toast.success('Backup restored successfully!');
                    render(containerRef);
                } catch {
                    if (window.Toast) window.Toast.error('Invalid backup JSON file');
                }
            };
            reader.readAsText(file);
        });
    }

    // Reset statistics button
    const resetStatsBtn = containerRef.querySelector('#set-btn-reset-stats');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', async () => {
            const confirmed = window.Modal
                ? await window.Modal.confirm('Reset Practice Statistics?', 'Are you sure you want to clear your practice session history and character accuracy records? Your level progress will be preserved.')
                : confirm('Are you sure you want to clear your practice session history?');

            if (confirmed && window.AppState) {
                window.AppState.set('morseStats', {
                    totalTime: 0,
                    sessions: 0,
                    highestWpm: 0,
                    charPerformance: {},
                    history: [],
                    streak: 0,
                    lastPracticeDate: null
                });
                if (window.Toast) window.Toast.info('Statistics have been reset');
                render(containerRef);
            }
        });
    }

    // Reset all progress button
    const resetProgBtn = containerRef.querySelector('#set-btn-reset-progress');
    if (resetProgBtn) {
        resetProgBtn.addEventListener('click', async () => {
            const confirmed = window.Modal
                ? await window.Modal.confirm('⚠️ Reset All Progress?', 'This will permanently wipe your unlocked levels, exam scores, and achievements. This action CANNOT be undone!')
                : confirm('This will permanently wipe your unlocked levels and scores. Continue?');

            if (confirmed && window.AppState) {
                window.AppState.set('morseProgress', {
                    currentLevel: 1,
                    completedLevels: [],
                    scores: {},
                    achievements: []
                });
                if (window.Toast) window.Toast.warning('Curriculum progress reset to Level 1');
                render(containerRef);
            }
        });
    }
}

export function render(container) {
    containerRef = container;
    container.innerHTML = renderSettingsHTML();
    bindSettingsEvents();
}

export function init() {
    // Loaded
}

export function destroy() {
    if (saveDebounce) {
        clearTimeout(saveDebounce);
        saveDebounce = null;
    }
    containerRef = null;
}
