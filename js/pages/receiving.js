// Morse Academy — Receiving Practice Page
// Audio-focused Morse receiving trainer with Audio-Only Mode and character mistake tracking

let containerRef = null;
let currentItem = null;
let currentMorse = '';
let isAudioOnly = true;
let isPlayingAudio = false;
let startTime = null;

let sessionStats = {
    totalItems: 0,
    correctItems: 0,
    totalChars: 0,
    correctChars: 0,
    charPerformance: {}, // { char: { total, correct, times: [] } }
    weakChars: new Set(),
    history: []
};

let config = {
    mode: 'alphabet', // 'alphabet' | 'numbers' | 'punctuation' | 'random' | 'five-char' | 'words' | 'sentences' | 'callsigns'
    wpm: 15,
    farnsworthWpm: 10,
    frequency: 600,
    volume: 0.7,
    autoAdvance: true
};

const PRACTICE_DATA = {
    words: [
        'RADIO', 'SIGNAL', 'ANTENNA', 'STATION', 'OPERATOR', 'MESSAGE', 'CONTACT',
        'REPORT', 'MORSE', 'HELLO', 'WORLD', 'ROGER', 'AGAIN', 'THANKS', 'WEATHER',
        'FREQ', 'POWER', 'BATTERY', 'TRANSMIT', 'RECEIVE', 'CIRCUIT', 'KEYER'
    ],
    sentences: [
        'CQ CQ CQ DE W1AW K',
        'UR RST IS 599 5NN HR IN BOSTON',
        'TNX FER CALL UR SIG 589',
        'MY NAME IS BOB AND QTH IS LONDON',
        'PSE QSL VIA BUREAU 73',
        'THE QUICK BROWN FOX JUMPS OVER LAZY DOG',
        'RIG HR IS 100 WATTS TO DIPOLE'
    ],
    callsigns: [
        'W1AW', 'K6STI', 'N4ZR', 'G4ZFE', 'M0MCX', 'VK3UM', 'JA1ABC', 'JH4UYB',
        'DL7NDR', 'F5IN', 'PY2XB', 'VE3KRG', 'ZL2AGY', 'EA4TX', 'I2WIJ', 'SM5AJV'
    ]
};

export function render(container) {
    containerRef = container;

    // Load initial settings from AppState
    if (window.AppState) {
        const s = window.AppState.getSettings();
        if (s.wpm) config.wpm = s.wpm;
        if (s.farnsworthWpm) config.farnsworthWpm = s.farnsworthWpm;
        if (s.frequency) config.frequency = s.frequency;
        if (s.volume !== undefined) config.volume = s.volume;
    }

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">🎧 Audio Morse Receiving Trainer</h1>
                        <p class="ma-text">Train your ear to recognize Morse rhythm directly without counting dots and dashes. Features dedicated Audio-Only Mode and mistake diagnostic.</p>
                    </div>
                    <div class="ma-flex" style="gap: 0.75rem; align-items: center;">
                        <label class="ma-toggle" title="Hide all visual dots and dashes while copying">
                            <input type="checkbox" id="toggle-audio-only" ${isAudioOnly ? 'checked' : ''}>
                            <span class="ma-toggle__slider"></span>
                        </label>
                        <span id="audio-only-label" class="ma-badge ${isAudioOnly ? 'ma-badge--info' : 'ma-badge--warning'}">
                            ${isAudioOnly ? '🔒 Audio-Only Mode: ON' : '👁️ Visual Hints: ON'}
                        </span>
                    </div>
                </div>
            </header>

            <!-- Configuration & Mode Strip -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__body" style="padding: 1.25rem 1.5rem;">
                    <div class="ma-grid ma-grid--4col" style="gap: 1.25rem; align-items: flex-end;">
                        <div>
                            <label class="ma-label" for="rx-mode-select">Practice Mode</label>
                            <select id="rx-mode-select" class="ma-select">
                                <option value="alphabet" ${config.mode === 'alphabet' ? 'selected' : ''}>Letters (A–Z)</option>
                                <option value="numbers" ${config.mode === 'numbers' ? 'selected' : ''}>Numbers (0–9)</option>
                                <option value="punctuation" ${config.mode === 'punctuation' ? 'selected' : ''}>Punctuation Marks</option>
                                <option value="random" ${config.mode === 'random' ? 'selected' : ''}>Random Groups (3–4 chars)</option>
                                <option value="five-char" ${config.mode === 'five-char' ? 'selected' : ''}>5-Character Groups</option>
                                <option value="words" ${config.mode === 'words' ? 'selected' : ''}>Common Words</option>
                                <option value="callsigns" ${config.mode === 'callsigns' ? 'selected' : ''}>Amateur Callsigns</option>
                                <option value="sentences" ${config.mode === 'sentences' ? 'selected' : ''}>Complete Sentences</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="rx-wpm-slider">Character Speed: <strong id="rx-wpm-label">${config.wpm} WPM</strong></label>
                            <input type="range" id="rx-wpm-slider" class="ma-range" min="5" max="35" value="${config.wpm}">
                        </div>
                        <div>
                            <label class="ma-label" for="rx-fwpm-slider">Farnsworth Spacing: <strong id="rx-fwpm-label">${config.farnsworthWpm} WPM</strong></label>
                            <input type="range" id="rx-fwpm-slider" class="ma-range" min="5" max="30" value="${config.farnsworthWpm}">
                        </div>
                        <div>
                            <label class="ma-label" for="rx-freq-slider">Pitch: <strong id="rx-freq-label">${config.frequency} Hz</strong></label>
                            <input type="range" id="rx-freq-slider" class="ma-range" min="400" max="1000" step="25" value="${config.frequency}">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Central Trainer Stage -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__header">
                    <span id="question-number-badge" class="ma-badge ma-badge--info">Question #1</span>
                    <div class="ma-flex" style="gap: 0.5rem;">
                        <button id="rx-hint-btn" class="ma-btn ma-btn--ghost ma-btn--sm" title="Show Morse Hint">💡 Hint</button>
                        <button id="rx-next-btn" class="ma-btn ma-btn--ghost ma-btn--sm">Skip & Next ⏩</button>
                    </div>
                </div>
                <div class="ma-card__body" style="text-align: center; padding: 2.5rem 1.5rem;">
                    <!-- Audio Wave / Speaker Visualization -->
                    <div id="rx-speaker-anim" style="width: 90px; height: 90px; margin: 0 auto 1.5rem; border-radius: 50%; background: var(--bg-secondary); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 2.25rem; transition: transform 0.15s ease, border-color 0.15s ease;">
                        <span>🔊</span>
                    </div>

                    <!-- Visual Morse Display (Hidden in Audio-Only Mode) -->
                    <div id="rx-visual-morse" style="min-height: 48px; margin-bottom: 1.5rem; display: ${isAudioOnly ? 'none' : 'block'};">
                        <div id="rx-morse-elements" class="ma-morse-display" style="justify-content: center;">
                            <!-- Filled dynamically -->
                        </div>
                    </div>

                    <!-- Playback Controls -->
                    <div class="ma-flex" style="justify-content: center; gap: 1rem; margin-bottom: 2rem;">
                        <button id="rx-play-btn" class="ma-btn ma-btn--primary ma-btn--lg" style="min-width: 160px;">
                            ▶️ Play Audio
                        </button>
                        <button id="rx-stop-btn" class="ma-btn ma-btn--secondary ma-btn--lg" style="display: none;">
                            ⏹️ Stop
                        </button>
                    </div>

                    <!-- Answer Transcription Input -->
                    <div style="max-width: 480px; margin: 0 auto;">
                        <form id="rx-answer-form" onsubmit="return false;">
                            <div class="ma-input-group" style="margin-bottom: 0.75rem;">
                                <input type="text" id="rx-user-input" class="ma-input" placeholder="Type what you hear..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-size: 1.375rem; text-align: center; text-transform: uppercase; font-family: monospace; letter-spacing: 0.15em;">
                            </div>
                            <button type="submit" id="rx-submit-btn" class="ma-btn ma-btn--success" style="width: 100%;">
                                Check Answer [Enter]
                            </button>
                        </form>
                    </div>

                    <!-- Feedback & Mistake Highlighting Box -->
                    <div id="rx-feedback-box" style="margin-top: 1.75rem; min-height: 70px; display: none;">
                        <div id="rx-result-status" style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;"></div>
                        <div id="rx-diff-display" style="font-family: monospace; font-size: 1.5rem; letter-spacing: 0.15em;"></div>
                        <div id="rx-solution-morse" class="ma-text--muted" style="margin-top: 0.5rem; font-family: monospace;"></div>
                    </div>
                </div>
            </div>

            <!-- Session Performance & Weak Character Analytics -->
            <div class="ma-grid ma-grid--2col" style="gap: 1.5rem;">
                <!-- Performance Statistics -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Current Session Summary</h3>
                    </div>
                    <div class="ma-card__body">
                        <div class="ma-grid ma-grid--3col" style="text-align: center;">
                            <div>
                                <div class="ma-stat-value" id="stat-rx-accuracy">0%</div>
                                <div class="ma-stat-label">Accuracy</div>
                            </div>
                            <div>
                                <div class="ma-stat-value" id="stat-rx-completed">0</div>
                                <div class="ma-stat-label">Completed</div>
                            </div>
                            <div>
                                <div class="ma-stat-value" id="stat-rx-chars">0</div>
                                <div class="ma-stat-label">Total Chars</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Weak Characters Diagnostic -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Weak Character Tracker</h3>
                        <span class="ma-badge ma-badge--warning" id="weak-count-badge">0 flagged</span>
                    </div>
                    <div class="ma-card__body">
                        <p class="ma-text--muted" style="font-size: 0.875rem; margin-bottom: 0.75rem;">
                            Characters with accuracy under 80% are automatically logged for focused training.
                        </p>
                        <div id="weak-chars-container" class="ma-flex" style="flex-wrap: wrap; gap: 0.5rem;">
                            <span class="ma-text--muted" style="font-size: 0.875rem;">None yet — great copy!</span>
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

    // Toggle Audio-Only
    const toggle = containerRef.querySelector('#toggle-audio-only');
    const label = containerRef.querySelector('#audio-only-label');
    const visualDiv = containerRef.querySelector('#rx-visual-morse');

    if (toggle) {
        toggle.addEventListener('change', (e) => {
            isAudioOnly = e.target.checked;
            if (label) {
                label.className = `ma-badge ${isAudioOnly ? 'ma-badge--info' : 'ma-badge--warning'}`;
                label.textContent = isAudioOnly ? '🔒 Audio-Only Mode: ON' : '👁️ Visual Hints: ON';
            }
            if (visualDiv) {
                visualDiv.style.display = isAudioOnly ? 'none' : 'block';
            }
        });
    }

    // Controls
    const modeSelect = containerRef.querySelector('#rx-mode-select');
    const wpmSlider = containerRef.querySelector('#rx-wpm-slider');
    const fwpmSlider = containerRef.querySelector('#rx-fwpm-slider');
    const freqSlider = containerRef.querySelector('#rx-freq-slider');

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            config.mode = e.target.value;
            loadNewQuestion();
        });
    }

    if (wpmSlider) {
        wpmSlider.addEventListener('input', (e) => {
            config.wpm = parseInt(e.target.value, 10);
            const wpmLabel = containerRef.querySelector('#rx-wpm-label');
            if (wpmLabel) wpmLabel.textContent = `${config.wpm} WPM`;

            // Adjust Farnsworth max
            if (fwpmSlider) {
                fwpmSlider.max = config.wpm;
                if (config.farnsworthWpm > config.wpm) {
                    config.farnsworthWpm = config.wpm;
                    fwpmSlider.value = config.farnsworthWpm;
                    const fwpmLabel = containerRef.querySelector('#rx-fwpm-label');
                    if (fwpmLabel) fwpmLabel.textContent = `${config.farnsworthWpm} WPM`;
                }
            }
        });
    }

    if (fwpmSlider) {
        fwpmSlider.addEventListener('input', (e) => {
            config.farnsworthWpm = parseInt(e.target.value, 10);
            const fwpmLabel = containerRef.querySelector('#rx-fwpm-label');
            if (fwpmLabel) fwpmLabel.textContent = `${config.farnsworthWpm} WPM`;
        });
    }

    if (freqSlider) {
        freqSlider.addEventListener('input', (e) => {
            config.frequency = parseInt(e.target.value, 10);
            const freqLabel = containerRef.querySelector('#rx-freq-label');
            if (freqLabel) freqLabel.textContent = `${config.frequency} Hz`;
            if (window.MorseAudio) window.MorseAudio.setFrequency(config.frequency);
        });
    }

    // Play / Stop Buttons
    const playBtn = containerRef.querySelector('#rx-play-btn');
    const stopBtn = containerRef.querySelector('#rx-stop-btn');
    if (playBtn) playBtn.addEventListener('click', playCurrentAudio);
    if (stopBtn) stopBtn.addEventListener('click', stopCurrentAudio);

    // Skip / Hint
    const skipBtn = containerRef.querySelector('#rx-next-btn');
    const hintBtn = containerRef.querySelector('#rx-hint-btn');
    if (skipBtn) skipBtn.addEventListener('click', () => loadNewQuestion());
    if (hintBtn) hintBtn.addEventListener('click', revealHint);

    // Answer Submission
    const form = containerRef.querySelector('#rx-answer-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            evaluateAnswer();
        });
    }
}

function generateItemForMode(mode) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const punctuation = '.,?/-=';

    switch (mode) {
        case 'alphabet':
            return letters[Math.floor(Math.random() * letters.length)];
        case 'numbers':
            return numbers[Math.floor(Math.random() * numbers.length)];
        case 'punctuation':
            return punctuation[Math.floor(Math.random() * punctuation.length)];
        case 'random': {
            const length = 3 + Math.floor(Math.random() * 2);
            let s = '';
            for (let i = 0; i < length; i++) {
                s += letters[Math.floor(Math.random() * letters.length)];
            }
            return s;
        }
        case 'five-char': {
            let s = '';
            for (let i = 0; i < 5; i++) {
                s += letters[Math.floor(Math.random() * letters.length)];
            }
            return s;
        }
        case 'words':
            return PRACTICE_DATA.words[Math.floor(Math.random() * PRACTICE_DATA.words.length)];
        case 'sentences':
            return PRACTICE_DATA.sentences[Math.floor(Math.random() * PRACTICE_DATA.sentences.length)];
        case 'callsigns':
            return PRACTICE_DATA.callsigns[Math.floor(Math.random() * PRACTICE_DATA.callsigns.length)];
        default:
            return letters[Math.floor(Math.random() * letters.length)];
    }
}

function loadNewQuestion() {
    stopCurrentAudio();
    currentItem = generateItemForMode(config.mode);
    const engine = window.MorseEngine;
    currentMorse = engine ? engine.textToMorse(currentItem) : '';
    startTime = performance.now();

    if (!containerRef) return;

    // Reset UI
    const input = containerRef.querySelector('#rx-user-input');
    if (input) {
        input.value = '';
        input.disabled = false;
        input.focus();
    }

    const badge = containerRef.querySelector('#question-number-badge');
    if (badge) badge.textContent = `Question #${sessionStats.totalItems + 1}`;

    const feedbackBox = containerRef.querySelector('#rx-feedback-box');
    if (feedbackBox) feedbackBox.style.display = 'none';

    renderVisualMorseElements(currentMorse);

    const visualDiv = containerRef.querySelector('#rx-visual-morse');
    if (visualDiv) {
        visualDiv.style.display = isAudioOnly ? 'none' : 'block';
    }

    // Automatically play on new question
    setTimeout(playCurrentAudio, 300);
}

function renderVisualMorseElements(morse) {
    if (!containerRef) return;
    const container = containerRef.querySelector('#rx-morse-elements');
    if (!container) return;

    let html = '';
    for (const char of morse) {
        if (char === '.') {
            html += `<span class="ma-dot" style="margin: 0 3px;"></span>`;
        } else if (char === '-') {
            html += `<span class="ma-dash" style="margin: 0 3px;"></span>`;
        } else if (char === ' ') {
            html += `<span style="display: inline-block; width: 14px;"></span>`;
        } else if (char === '/') {
            html += `<span style="display: inline-block; width: 28px; color: var(--text-muted); font-weight: bold;">/</span>`;
        }
    }
    container.innerHTML = html;
}

function playCurrentAudio() {
    if (!currentItem) return;
    if (window.MorseAudio) {
        window.MorseAudio.init();
        window.MorseAudio.stop();
    }

    isPlayingAudio = true;
    updateAudioPlaybackUI(true);

    const audio = window.MorseAudio;
    if (audio) {
        audio.playSequence(currentItem, {
            wpm: config.wpm,
            farnsworthWpm: config.farnsworthWpm,
            frequency: config.frequency,
            volume: config.volume,
            onComplete: () => {
                isPlayingAudio = false;
                updateAudioPlaybackUI(false);
            }
        });
    }
}

function stopCurrentAudio() {
    if (window.MorseAudio) {
        window.MorseAudio.stop();
    }
    isPlayingAudio = false;
    updateAudioPlaybackUI(false);
}

function updateAudioPlaybackUI(active) {
    if (!containerRef) return;
    const playBtn = containerRef.querySelector('#rx-play-btn');
    const stopBtn = containerRef.querySelector('#rx-stop-btn');
    const speaker = containerRef.querySelector('#rx-speaker-anim');

    if (playBtn && stopBtn) {
        playBtn.style.display = active ? 'none' : 'inline-flex';
        stopBtn.style.display = active ? 'inline-flex' : 'none';
    }

    if (speaker) {
        if (active) {
            speaker.style.transform = 'scale(1.1)';
            speaker.style.borderColor = 'var(--accent-cyan)';
            speaker.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.4)';
        } else {
            speaker.style.transform = 'scale(1)';
            speaker.style.borderColor = 'var(--border-color)';
            speaker.style.boxShadow = 'none';
        }
    }
}

function revealHint() {
    if (!containerRef) return;
    const visualDiv = containerRef.querySelector('#rx-visual-morse');
    if (visualDiv) visualDiv.style.display = 'block';
    if (window.Toast) window.Toast.info(`Morse hint: ${currentMorse}`);
}

function evaluateAnswer() {
    if (!containerRef || !currentItem) return;
    const input = containerRef.querySelector('#rx-user-input');
    if (!input) return;

    const userVal = input.value.trim().toUpperCase();
    const expected = currentItem.trim().toUpperCase();
    const responseTimeMs = startTime ? Math.round(performance.now() - startTime) : 2000;

    sessionStats.totalItems++;

    // Calculate character by character accuracy & diff
    const maxLen = Math.max(userVal.length, expected.length);
    let correctCount = 0;
    let diffHtml = '';

    for (let i = 0; i < maxLen; i++) {
        const u = userVal[i] || '';
        const exp = expected[i] || '';

        if (u === exp) {
            correctCount++;
            diffHtml += `<span style="color: var(--accent-green);">${u}</span>`;
            recordCharPerformance(exp, true, responseTimeMs);
        } else {
            recordCharPerformance(exp, false, responseTimeMs);
            if (u && exp) {
                diffHtml += `<span style="color: var(--accent-red); text-decoration: line-through;">${u}</span><span style="color: var(--accent-cyan); font-weight: bold;">[${exp}]</span>`;
            } else if (u && !exp) {
                diffHtml += `<span style="color: var(--accent-red); text-decoration: line-through;">${u}</span>`;
            } else {
                diffHtml += `<span style="color: var(--accent-amber);">[${exp}]</span>`;
            }
        }
    }

    const accuracyPct = maxLen > 0 ? Math.round((correctCount / maxLen) * 100) : 0;
    const isPerfect = accuracyPct === 100;

    if (isPerfect) {
        sessionStats.correctItems++;
    }
    sessionStats.totalChars += expected.length;
    sessionStats.correctChars += correctCount;

    // Show Feedback Box
    const feedbackBox = containerRef.querySelector('#rx-feedback-box');
    const statusEl = containerRef.querySelector('#rx-result-status');
    const diffEl = containerRef.querySelector('#rx-diff-display');
    const solMorseEl = containerRef.querySelector('#rx-solution-morse');

    if (feedbackBox && statusEl && diffEl && solMorseEl) {
        feedbackBox.style.display = 'block';
        if (isPerfect) {
            statusEl.innerHTML = `<span style="color: var(--accent-green);">✓ Correct! (${accuracyPct}%)</span>`;
        } else {
            statusEl.innerHTML = `<span style="color: var(--accent-amber);">Expected: "${expected}" (${accuracyPct}%)</span>`;
        }
        diffEl.innerHTML = diffHtml;
        solMorseEl.textContent = `Morse Code: ${currentMorse}`;
    }

    // Always reveal visual Morse after submit
    const visualDiv = containerRef.querySelector('#rx-visual-morse');
    if (visualDiv) visualDiv.style.display = 'block';

    updateSessionAnalytics();

    // Auto-advance after brief pause
    input.disabled = true;
    setTimeout(() => {
        loadNewQuestion();
    }, isPerfect ? 1200 : 2500);
}

function recordCharPerformance(char, correct, responseTime) {
    if (!char || char === ' ') return;
    const c = char.toUpperCase();

    if (!sessionStats.charPerformance[c]) {
        sessionStats.charPerformance[c] = { total: 0, correct: 0, avgTime: responseTime };
    }
    const stat = sessionStats.charPerformance[c];
    stat.total++;
    if (correct) stat.correct++;
    stat.avgTime = Math.round((stat.avgTime + responseTime) / 2);

    // Check if weak (< 80% accuracy after 2 attempts)
    const acc = (stat.correct / stat.total) * 100;
    if (stat.total >= 2 && acc < 80) {
        sessionStats.weakChars.add(c);
    } else if (stat.total >= 3 && acc >= 80) {
        sessionStats.weakChars.delete(c);
    }

    // Optional API sync
    if (window.MorseAPI) {
        window.MorseAPI.post('practice/char-performance', {
            char: c,
            correct: correct,
            response_time: responseTime
        }).catch(() => {});
    }
}

function updateSessionAnalytics() {
    if (!containerRef) return;

    const accEl = containerRef.querySelector('#stat-rx-accuracy');
    const compEl = containerRef.querySelector('#stat-rx-completed');
    const charsEl = containerRef.querySelector('#stat-rx-chars');

    const total = sessionStats.totalChars;
    const overallAcc = total > 0 ? Math.round((sessionStats.correctChars / total) * 100) : 100;

    if (accEl) accEl.textContent = `${overallAcc}%`;
    if (compEl) compEl.textContent = `${sessionStats.correctItems}/${sessionStats.totalItems}`;
    if (charsEl) charsEl.textContent = sessionStats.totalChars;

    // Weak chars container
    const weakContainer = containerRef.querySelector('#weak-chars-container');
    const weakBadge = containerRef.querySelector('#weak-count-badge');
    if (weakBadge) weakBadge.textContent = `${sessionStats.weakChars.size} flagged`;

    if (weakContainer) {
        if (sessionStats.weakChars.size === 0) {
            weakContainer.innerHTML = `<span class="ma-text--muted" style="font-size: 0.875rem;">None yet — strong receiving!</span>`;
        } else {
            let html = '';
            sessionStats.weakChars.forEach(c => {
                const stat = sessionStats.charPerformance[c];
                const pct = stat ? Math.round((stat.correct / stat.total) * 100) : 0;
                html += `<span class="ma-badge ma-badge--danger" style="font-size: 0.875rem;">${c} (${pct}%)</span>`;
            });
            weakContainer.innerHTML = html;
        }
    }

    // Update global state
    if (window.AppState) {
        window.AppState.updateStats({
            charPerformance: sessionStats.charPerformance
        });
    }
}

export function init() {
    loadNewQuestion();
}

export function destroy() {
    stopCurrentAudio();
    containerRef = null;
    currentItem = null;
    currentMorse = '';
}
