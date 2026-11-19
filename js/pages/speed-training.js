// Morse Academy — Speed Training Laboratory
// Speed progression engine with Farnsworth separation and adaptive speed scaling

let containerRef = null;
let currentExercise = null;
let currentMorse = '';
let exerciseIndex = 0;
let roundTotal = 5; // 5 exercises per progression round
let roundCorrect = 0;
let isPlaying = false;
let autoProgression = true;

let config = {
    charWpm: 15,
    farnsworthWpm: 10,
    frequency: 600,
    volume: 0.7,
    contentType: 'characters' // 'characters' | 'words' | 'mixed'
};

const WORDS_POOL = [
    'PARIS', 'QUICK', 'RADIO', 'TOWER', 'SPEED', 'FLASH', 'MOTOR',
    'WORLD', 'STATION', 'AUDIO', 'ROGER', 'CWKEY', 'ANTENNA', 'POWER'
];

export function render(container) {
    containerRef = container;

    // Load initial settings
    if (window.AppState) {
        const s = window.AppState.getSettings();
        if (s.wpm) config.charWpm = s.wpm;
        if (s.farnsworthWpm) config.farnsworthWpm = s.farnsworthWpm;
        if (s.frequency) config.frequency = s.frequency;
        if (s.volume !== undefined) config.volume = s.volume;
    }

    const stats = window.AppState ? window.AppState.getStats() : { highestWpm: 0 };
    const currentHighWpm = stats.highestWpm || 0;

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">⚡ Morse Speed Training Laboratory</h1>
                        <p class="ma-text">Push your copy speed to the next level. Characters are sent at full tone speed while spacing adjusts your effective reading rate.</p>
                    </div>
                    <div class="ma-flex" style="gap: 0.75rem; align-items: center;">
                        <span class="ma-badge ma-badge--success" id="personal-record-badge">
                            🏆 Personal Record: ${currentHighWpm} WPM
                        </span>
                    </div>
                </div>
            </header>

            <!-- Speed Presets Bar -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__header">
                    <span class="ma-label" style="margin: 0;">Quick Speed Presets (WPM)</span>
                    <span class="ma-text--muted" style="font-size: 0.8125rem;">Standard Amateur Speeds</span>
                </div>
                <div class="ma-card__body" style="padding: 1rem 1.5rem;">
                    <div class="ma-flex" style="flex-wrap: wrap; gap: 0.75rem;" id="preset-buttons-container">
                        ${[5, 8, 10, 12, 15, 20, 25, 30].map(speed => `
                            <button class="ma-btn ${config.charWpm === speed ? 'ma-btn--primary' : 'ma-btn--ghost'} ma-btn--sm speed-preset-btn" data-wpm="${speed}">
                                ${speed} WPM
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Dual Speed Controls & Farnsworth Explainer -->
            <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 1.5rem;">
                <!-- Left: Dual Sliders -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Speed Calibration</h3>
                        <div class="ma-flex" style="align-items: center; gap: 0.5rem;">
                            <label class="ma-toggle" title="Step up when accuracy >= 90%, step down if < 75%">
                                <input type="checkbox" id="toggle-auto-progression" ${autoProgression ? 'checked' : ''}>
                                <span class="ma-toggle__slider"></span>
                            </label>
                            <span class="ma-label" style="margin: 0; font-size: 0.8125rem;">Auto-Progress</span>
                        </div>
                    </div>
                    <div class="ma-card__body">
                        <!-- Character Speed -->
                        <div style="margin-bottom: 1.5rem;">
                            <div class="ma-flex" style="justify-content: space-between; margin-bottom: 0.25rem;">
                                <label class="ma-label" for="speed-char-wpm">Character Speed (Tone Speed):</label>
                                <strong id="char-wpm-label" style="color: var(--accent-cyan);">${config.charWpm} WPM</strong>
                            </div>
                            <input type="range" id="speed-char-wpm" class="ma-range" min="5" max="45" value="${config.charWpm}">
                            <small class="ma-text--muted">Duration of dots (1200 / ${config.charWpm} = ${(1200 / config.charWpm).toFixed(0)}ms) and dashes.</small>
                        </div>

                        <!-- Effective Spacing / Farnsworth -->
                        <div style="margin-bottom: 1.25rem;">
                            <div class="ma-flex" style="justify-content: space-between; margin-bottom: 0.25rem;">
                                <label class="ma-label" for="speed-farnsworth-wpm">Effective Speed (Farnsworth Spacing):</label>
                                <strong id="fwpm-label" style="color: var(--accent-amber);">${config.farnsworthWpm} WPM</strong>
                            </div>
                            <input type="range" id="speed-farnsworth-wpm" class="ma-range" min="5" max="35" value="${config.farnsworthWpm}">
                            <small class="ma-text--muted">Pauses between letters and words stretched for mental processing.</small>
                        </div>

                        <!-- Content Type -->
                        <div class="ma-grid ma-grid--2col" style="gap: 1rem;">
                            <div>
                                <label class="ma-label" for="speed-content-type">Exercise Content</label>
                                <select id="speed-content-type" class="ma-select">
                                    <option value="characters" ${config.contentType === 'characters' ? 'selected' : ''}>Single Characters</option>
                                    <option value="words" ${config.contentType === 'words' ? 'selected' : ''}>High-Speed Words</option>
                                    <option value="mixed" ${config.contentType === 'mixed' ? 'selected' : ''}>Mixed 4-Char Groups</option>
                                </select>
                            </div>
                            <div>
                                <label class="ma-label" for="speed-freq-slider">Pitch: <span id="speed-freq-label">${config.frequency} Hz</span></label>
                                <input type="range" id="speed-freq-slider" class="ma-range" min="400" max="1000" step="25" value="${config.frequency}">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Speed Progression Status & Meter -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Progression Engine</h3>
                        <span id="progression-round-badge" class="ma-badge ma-badge--info">Round 1 (0/${roundTotal})</span>
                    </div>
                    <div class="ma-card__body" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="ma-flex" style="align-items: center; justify-content: space-around; margin: 1rem 0;">
                                <div style="text-align: center;">
                                    <div class="ma-stat-value" id="current-stage-wpm">${config.charWpm}</div>
                                    <div class="ma-stat-label">Tone WPM</div>
                                </div>
                                <div style="font-size: 1.5rem; color: var(--text-muted);">➔</div>
                                <div style="text-align: center;">
                                    <div class="ma-stat-value" id="current-round-acc" style="color: var(--accent-green);">100%</div>
                                    <div class="ma-stat-label">Round Accuracy</div>
                                </div>
                            </div>

                            <!-- Progress to next speed step -->
                            <div style="margin-top: 1rem;">
                                <div class="ma-flex" style="justify-content: space-between; font-size: 0.8125rem; margin-bottom: 0.25rem;">
                                    <span>Round Progress</span>
                                    <span id="round-progress-text">0 / ${roundTotal}</span>
                                </div>
                                <div class="ma-progress">
                                    <div id="round-progress-bar" class="ma-progress__bar ma-progress__bar--cyan" style="width: 0%;"></div>
                                </div>
                            </div>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: var(--border-radius-sm); margin-top: 1rem; font-size: 0.8125rem;">
                            <strong>Progression Rule:</strong> ≥ 90% accuracy advances speed (+1 WPM). < 75% steps down (-1 WPM) to consolidate fundamentals.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Speed Drill Exercise Stage -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__body" style="text-align: center; padding: 2.5rem 1.5rem;">
                    <div class="ma-stat-label" style="margin-bottom: 0.5rem;">CURRENT SPEED TARGET</div>

                    <!-- Pulse Wave Icon -->
                    <div id="speed-sound-wave" style="width: 80px; height: 80px; margin: 0 auto 1.5rem; border-radius: 50%; background: var(--bg-secondary); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                        ⚡
                    </div>

                    <!-- Audio Playback Buttons -->
                    <div class="ma-flex" style="justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                        <button id="speed-play-btn" class="ma-btn ma-btn--primary ma-btn--lg" style="min-width: 160px;">
                            ▶️ Play Audio
                        </button>
                    </div>

                    <!-- Rapid Response Input -->
                    <div style="max-width: 440px; margin: 0 auto;">
                        <form id="speed-input-form" onsubmit="return false;">
                            <input type="text" id="speed-answer-input" class="ma-input" placeholder="Type instantly..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-size: 1.5rem; text-align: center; font-family: monospace; letter-spacing: 0.2em; text-transform: uppercase;">
                            <div style="margin-top: 0.75rem;">
                                <button type="submit" id="speed-submit-btn" class="ma-btn ma-btn--success" style="width: 100%;">
                                    Submit [Enter]
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Instant Feedback -->
                    <div id="speed-feedback" style="margin-top: 1.5rem; min-height: 48px; display: none;">
                        <span id="speed-feedback-status" style="font-size: 1.25rem; font-weight: 700;"></span>
                    </div>
                </div>
            </div>

            <!-- Speed Milestone Badges & Reference Table -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h3 class="ma-h3">Speed Benchmarks & Achievements</h3>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--4col" style="gap: 1rem; text-align: center;">
                        <div class="ma-card" style="padding: 1rem; background: var(--bg-secondary);">
                            <div style="font-size: 1.5rem;">🥉</div>
                            <strong>Novice (10 WPM)</strong>
                            <p class="ma-text--muted" style="font-size: 0.75rem;">Standard Entry License</p>
                        </div>
                        <div class="ma-card" style="padding: 1rem; background: var(--bg-secondary);">
                            <div style="font-size: 1.5rem;">🥈</div>
                            <strong>Intermediate (15 WPM)</strong>
                            <p class="ma-text--muted" style="font-size: 0.75rem;">General Class Standard</p>
                        </div>
                        <div class="ma-card" style="padding: 1rem; background: var(--bg-secondary);">
                            <div style="font-size: 1.5rem;">🥇</div>
                            <strong>Advanced (20 WPM)</strong>
                            <p class="ma-text--muted" style="font-size: 0.75rem;">Extra Class Proficiency</p>
                        </div>
                        <div class="ma-card" style="padding: 1rem; background: var(--bg-secondary);">
                            <div style="font-size: 1.5rem;">⚡</div>
                            <strong>High Speed (25+ WPM)</strong>
                            <p class="ma-text--muted" style="font-size: 0.75rem;">Contest & DX Master</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
}

function attachEventListeners() {
    if (!containerRef) return;

    // Presets
    const presetBtns = containerRef.querySelectorAll('.speed-preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const wpm = parseInt(e.currentTarget.getAttribute('data-wpm'), 10);
            updateSpeedSetting(wpm);
            presetBtns.forEach(b => {
                b.className = b === e.currentTarget ? 'ma-btn ma-btn--primary ma-btn--sm speed-preset-btn' : 'ma-btn ma-btn--ghost ma-btn--sm speed-preset-btn';
            });
        });
    });

    // Character WPM Slider
    const charWpmSlider = containerRef.querySelector('#speed-char-wpm');
    if (charWpmSlider) {
        charWpmSlider.addEventListener('input', (e) => {
            updateSpeedSetting(parseInt(e.target.value, 10));
        });
    }

    // Farnsworth Slider
    const fwpmSlider = containerRef.querySelector('#speed-farnsworth-wpm');
    if (fwpmSlider) {
        fwpmSlider.addEventListener('input', (e) => {
            config.farnsworthWpm = parseInt(e.target.value, 10);
            const fwpmLabel = containerRef.querySelector('#fwpm-label');
            if (fwpmLabel) fwpmLabel.textContent = `${config.farnsworthWpm} WPM`;
        });
    }

    // Tone frequency
    const freqSlider = containerRef.querySelector('#speed-freq-slider');
    if (freqSlider) {
        freqSlider.addEventListener('input', (e) => {
            config.frequency = parseInt(e.target.value, 10);
            const label = containerRef.querySelector('#speed-freq-label');
            if (label) label.textContent = `${config.frequency} Hz`;
            if (window.MorseAudio) window.MorseAudio.setFrequency(config.frequency);
        });
    }

    // Content Type
    const contentTypeSelect = containerRef.querySelector('#speed-content-type');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', (e) => {
            config.contentType = e.target.value;
            loadNextExercise();
        });
    }

    // Auto Progression Toggle
    const autoToggle = containerRef.querySelector('#toggle-auto-progression');
    if (autoToggle) {
        autoToggle.addEventListener('change', (e) => {
            autoProgression = e.target.checked;
        });
    }

    // Audio Playback
    const playBtn = containerRef.querySelector('#speed-play-btn');
    if (playBtn) playBtn.addEventListener('click', playAudio);

    // Form
    const form = containerRef.querySelector('#speed-input-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            checkSpeedAnswer();
        });
    }
}

function updateSpeedSetting(newWpm) {
    config.charWpm = newWpm;
    if (config.farnsworthWpm > config.charWpm) {
        config.farnsworthWpm = config.charWpm;
    }

    if (!containerRef) return;
    const charSlider = containerRef.querySelector('#speed-char-wpm');
    const fwpmSlider = containerRef.querySelector('#speed-farnsworth-wpm');
    const charLabel = containerRef.querySelector('#char-wpm-label');
    const fwpmLabel = containerRef.querySelector('#fwpm-label');
    const stageWpm = containerRef.querySelector('#current-stage-wpm');

    if (charSlider) charSlider.value = config.charWpm;
    if (fwpmSlider) {
        fwpmSlider.max = config.charWpm;
        fwpmSlider.value = config.farnsworthWpm;
    }
    if (charLabel) charLabel.textContent = `${config.charWpm} WPM`;
    if (fwpmLabel) fwpmLabel.textContent = `${config.farnsworthWpm} WPM`;
    if (stageWpm) stageWpm.textContent = config.charWpm;
}

function generateSpeedItem() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    if (config.contentType === 'characters') {
        return chars[Math.floor(Math.random() * chars.length)];
    } else if (config.contentType === 'words') {
        return WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
    } else {
        // Mixed 4-char groups
        let s = '';
        for (let i = 0; i < 4; i++) {
            s += chars[Math.floor(Math.random() * chars.length)];
        }
        return s;
    }
}

function loadNextExercise() {
    currentExercise = generateSpeedItem();
    const engine = window.MorseEngine;
    currentMorse = engine ? engine.textToMorse(currentExercise) : '';

    if (!containerRef) return;
    const input = containerRef.querySelector('#speed-answer-input');
    const feedback = containerRef.querySelector('#speed-feedback');

    if (input) {
        input.value = '';
        input.disabled = false;
        input.focus();
    }
    if (feedback) feedback.style.display = 'none';

    setTimeout(playAudio, 350);
}

function playAudio() {
    if (!currentExercise) return;
    if (window.MorseAudio) {
        window.MorseAudio.init();
        window.MorseAudio.stop();
    }

    const wave = containerRef ? containerRef.querySelector('#speed-sound-wave') : null;
    if (wave) {
        wave.style.borderColor = 'var(--accent-cyan)';
        wave.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.5)';
    }

    if (window.MorseAudio) {
        window.MorseAudio.playSequence(currentExercise, {
            wpm: config.charWpm,
            farnsworthWpm: config.farnsworthWpm,
            frequency: config.frequency,
            volume: config.volume,
            onComplete: () => {
                if (wave) {
                    wave.style.borderColor = 'var(--border-color)';
                    wave.style.boxShadow = 'none';
                }
            }
        });
    }
}

function checkSpeedAnswer() {
    if (!containerRef || !currentExercise) return;
    const input = containerRef.querySelector('#speed-answer-input');
    if (!input) return;

    const val = input.value.trim().toUpperCase();
    const expected = currentExercise.trim().toUpperCase();
    const isCorrect = val === expected;

    exerciseIndex++;
    if (isCorrect) roundCorrect++;

    // Show feedback
    const feedback = containerRef.querySelector('#speed-feedback');
    const status = containerRef.querySelector('#speed-feedback-status');
    if (feedback && status) {
        feedback.style.display = 'block';
        if (isCorrect) {
            status.innerHTML = `<span style="color: var(--accent-green);">✓ Correct! [${expected}]</span>`;
        } else {
            status.innerHTML = `<span style="color: var(--accent-red);">Expected [${expected}], entered [${val}]</span>`;
        }
    }

    // Update Round Metrics
    const roundAcc = Math.round((roundCorrect / exerciseIndex) * 100);
    const roundAccEl = containerRef.querySelector('#current-round-acc');
    const roundProgText = containerRef.querySelector('#round-progress-text');
    const roundProgBar = containerRef.querySelector('#round-progress-bar');

    if (roundAccEl) roundAccEl.textContent = `${roundAcc}%`;
    if (roundProgText) roundProgText.textContent = `${exerciseIndex} / ${roundTotal}`;
    if (roundProgBar) roundProgBar.style.width = `${(exerciseIndex / roundTotal) * 100}%`;

    // Check personal record
    if (isCorrect && window.AppState) {
        const stats = window.AppState.getStats();
        if (config.charWpm > (stats.highestWpm || 0)) {
            window.AppState.updateStats({ highestWpm: config.charWpm });
            const prBadge = containerRef.querySelector('#personal-record-badge');
            if (prBadge) prBadge.textContent = `🏆 Personal Record: ${config.charWpm} WPM`;
            if (window.Toast) window.Toast.success(`🚀 New Personal Record: ${config.charWpm} WPM!`);
        }
    }

    // End of Round check
    if (exerciseIndex >= roundTotal) {
        input.disabled = true;
        setTimeout(handleRoundCompletion, 1200);
    } else {
        input.disabled = true;
        setTimeout(loadNextExercise, isCorrect ? 900 : 1800);
    }
}

function handleRoundCompletion() {
    const accuracy = Math.round((roundCorrect / roundTotal) * 100);

    if (autoProgression) {
        if (accuracy >= 90) {
            const nextWpm = config.charWpm + 1;
            updateSpeedSetting(nextWpm);
            if (window.Toast) window.Toast.success(`🎯 Outstanding ${accuracy}%! Speed increased to ${nextWpm} WPM!`);
        } else if (accuracy < 75 && config.charWpm > 5) {
            const prevWpm = config.charWpm - 1;
            updateSpeedSetting(prevWpm);
            if (window.Toast) window.Toast.info(`Speed reduced to ${prevWpm} WPM for consolidation.`);
        } else {
            if (window.Toast) window.Toast.info(`Solid round (${accuracy}%). Maintaining ${config.charWpm} WPM.`);
        }
    }

    // Reset round
    exerciseIndex = 0;
    roundCorrect = 0;

    const roundProgText = containerRef ? containerRef.querySelector('#round-progress-text') : null;
    const roundProgBar = containerRef ? containerRef.querySelector('#round-progress-bar') : null;
    if (roundProgText) roundProgText.textContent = `0 / ${roundTotal}`;
    if (roundProgBar) roundProgBar.style.width = `0%`;

    loadNextExercise();
}

export function init() {
    loadNextExercise();
}

export function destroy() {
    if (window.MorseAudio) window.MorseAudio.stop();
    containerRef = null;
    currentExercise = null;
    currentMorse = '';
}
