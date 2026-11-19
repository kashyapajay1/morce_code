// Morse Academy — Sending Practice Page
// Real-time Telegraph Key & Iambic Paddle practice with adaptive timing detection

let containerRef = null;
let audioCtx = null;
let sidetoneOsc = null;
let sidetoneGain = null;
let isKeyDown = false;
let keyPressStartTime = 0;
let keyReleaseStartTime = 0;
let interCharTimer = null;
let interWordTimer = null;
let currentMorseBuffer = '';
let decodedText = '';
let targetPrompt = '';
let promptIndex = 0;
let sessionStats = {
    charsSent: 0,
    correctChars: 0,
    ditsSent: 0,
    dahsSent: 0,
    startTime: null,
    dotDurations: [],
    errors: []
};

// Config & State
let config = {
    targetWpm: 15,
    keyMode: 'straight', // 'straight' | 'iambic-a' | 'iambic-b'
    practiceMode: 'free', // 'free' | 'chars' | 'words'
    keyBinding: 'Space',
    frequency: 600,
    volume: 0.7
};

// Canvas oscilloscope state
let animFrameId = null;
let oscilloscopeData = []; // [{ time, active }]

// Iambic paddle state
let paddleDitDown = false;
let paddleDahDown = false;
let iambicInterval = null;

export function render(container) {
    containerRef = container;

    // Load initial settings
    if (window.AppState) {
        const s = window.AppState.getSettings();
        if (s.wpm) config.targetWpm = s.wpm;
        if (s.frequency) config.frequency = s.frequency;
        if (s.volume !== undefined) config.volume = s.volume;
        if (s.keyBinding) config.keyBinding = s.keyBinding;
    }

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">📡 Telegraph-Key Sending Practice</h1>
                        <p class="ma-text">Send Morse code using your keyboard, mouse, touch, or paddle keyer. Features real-time adaptive decoding and timing analysis.</p>
                    </div>
                    <div class="ma-flex" style="gap: 0.5rem; align-items: center;">
                        <span id="sending-hw-badge" class="ma-badge ma-badge--info" title="Hardware Interface">
                            ⌨️ Key: <strong id="binding-label">${config.keyBinding}</strong>
                        </span>
                        <span id="sending-mode-badge" class="ma-badge ma-badge--success">
                            Mode: Straight Key
                        </span>
                    </div>
                </div>
            </header>

            <!-- Mode & Configuration Strip -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__body" style="padding: 1rem 1.5rem;">
                    <div class="ma-grid ma-grid--4col" style="align-items: center; gap: 1rem;">
                        <div>
                            <label class="ma-label" for="sending-practice-mode">Practice Mode</label>
                            <select id="sending-practice-mode" class="ma-select">
                                <option value="free" ${config.practiceMode === 'free' ? 'selected' : ''}>Free-Send (Sandbox)</option>
                                <option value="chars" ${config.practiceMode === 'chars' ? 'selected' : ''}>Random Characters</option>
                                <option value="words" ${config.practiceMode === 'words' ? 'selected' : ''}>Common Words</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="sending-key-mode">Keying Style</label>
                            <select id="sending-key-mode" class="ma-select">
                                <option value="straight" ${config.keyMode === 'straight' ? 'selected' : ''}>Straight Key (Manual)</option>
                                <option value="iambic-a" ${config.keyMode === 'iambic-a' ? 'selected' : ''}>Iambic Paddle (Auto Dits/Dahs)</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="sending-wpm">Target WPM: <span id="wpm-display">${config.targetWpm}</span></label>
                            <input id="sending-wpm" type="range" class="ma-range" min="5" max="35" value="${config.targetWpm}">
                        </div>
                        <div>
                            <label class="ma-label" for="sending-freq">Sidetone Pitch: <span id="freq-display">${config.frequency} Hz</span></label>
                            <input id="sending-freq" type="range" class="ma-range" min="400" max="1000" step="25" value="${config.frequency}">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Target Prompt Area (if not free-send) -->
            <div id="target-prompt-container" class="ma-card" style="margin-bottom: 1.5rem; display: ${config.practiceMode === 'free' ? 'none' : 'block'};">
                <div class="ma-card__body" style="text-align: center; padding: 1.25rem;">
                    <span class="ma-stat-label">Target Prompt</span>
                    <div id="target-prompt-display" style="font-size: 2.25rem; font-family: monospace; font-weight: 700; letter-spacing: 0.25em; margin: 0.5rem 0; color: var(--accent-cyan);">
                        HELLO
                    </div>
                    <div class="ma-text--muted" style="font-size: 0.875rem;">
                        Target Morse: <span id="target-morse-display" style="color: var(--accent-amber); font-family: monospace;">.... . .-.. .-.. ---</span>
                    </div>
                </div>
            </div>

            <!-- Main Interactive Station Layout -->
            <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; align-items: stretch; margin-bottom: 1.5rem;">
                <!-- Left: Telegraph Key & Controls -->
                <div class="ma-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div class="ma-card__header">
                        <h3 class="ma-h3" id="key-title">Straight Key Station</h3>
                        <span id="timing-status" class="ma-badge ma-badge--info">Ready</span>
                    </div>
                    <div class="ma-card__body" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px;">
                        <!-- Straight Key Mode Display -->
                        <div id="straight-key-area" style="display: ${config.keyMode === 'straight' ? 'block' : 'none'}; width: 100%;">
                            <div id="telegraph-key-btn" class="ma-telegraph-key" role="button" tabindex="0" aria-label="Telegraph Key">
                                <span>TAP</span>
                                <small style="font-size: 0.75rem; opacity: 0.7;">SPACE / CLICK</small>
                            </div>
                            <p class="ma-text--muted" style="font-size: 0.875rem; margin-top: 0.5rem;">
                                Press and hold <strong>[Spacebar]</strong> or click & hold the key.
                            </p>
                        </div>

                        <!-- Iambic Paddle Mode Display -->
                        <div id="paddle-key-area" style="display: ${config.keyMode === 'iambic-a' ? 'flex' : 'none'}; width: 100%; justify-content: center; gap: 1.5rem;">
                            <button id="paddle-dit-btn" class="ma-btn ma-btn--secondary" style="height: 120px; width: 120px; border-radius: 12px; font-size: 1.25rem; font-weight: 700; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <span>• DIT</span>
                                <small style="font-size: 0.75rem; opacity: 0.8;">[ Key or Left ]</small>
                            </button>
                            <button id="paddle-dah-btn" class="ma-btn ma-btn--primary" style="height: 120px; width: 120px; border-radius: 12px; font-size: 1.25rem; font-weight: 700; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <span>— DAH</span>
                                <small style="font-size: 0.75rem; opacity: 0.8;">] Key or Right</small>
                            </button>
                        </div>

                        <!-- Hardware / Web Serial Note -->
                        <div id="serial-note" style="margin-top: 1.25rem; padding: 0.5rem 1rem; background: var(--bg-secondary); border-radius: 6px; font-size: 0.8125rem; color: var(--text-muted); width: 100%; max-width: 440px;">
                            <div class="ma-flex" style="justify-content: space-between; align-items: center;">
                                <span>🔌 External Hardware Interface:</span>
                                <span id="serial-status-text">Ready (Keyboard / Mouse / Touch)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Live Decoding & Oscilloscope -->
                <div class="ma-card" style="display: flex; flex-direction: column;">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Live Oscilloscope & Decoder</h3>
                        <div class="ma-flex" style="gap: 0.5rem;">
                            <button id="clear-text-btn" class="ma-btn ma-btn--ghost ma-btn--sm">Clear</button>
                            <button id="copy-text-btn" class="ma-btn ma-btn--ghost ma-btn--sm">Copy</button>
                        </div>
                    </div>
                    <div class="ma-card__body">
                        <!-- Oscilloscope Canvas -->
                        <div style="background: #060911; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 0.5rem; margin-bottom: 1rem; position: relative;">
                            <canvas id="oscilloscope-canvas" width="480" height="70" style="width: 100%; height: 70px; display: block;"></canvas>
                            <div style="position: absolute; right: 8px; top: 6px; font-size: 0.6875rem; color: var(--accent-cyan); font-family: monospace;">
                                LIVE SIGNAL TIMING
                            </div>
                        </div>

                        <!-- Current Character & Morse Buffer -->
                        <div class="ma-flex" style="align-items: center; gap: 1rem; margin-bottom: 1rem; background: var(--bg-input); padding: 0.75rem 1rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                            <div style="text-align: center; min-width: 60px;">
                                <div class="ma-stat-label" style="font-size: 0.7rem;">CURRENT CHAR</div>
                                <div id="live-char-preview" style="font-size: 2rem; font-weight: 800; color: var(--accent-cyan); line-height: 1;">—</div>
                            </div>
                            <div style="flex: 1;">
                                <div class="ma-stat-label" style="font-size: 0.7rem;">BUFFERED SYMBOLS</div>
                                <div id="live-symbol-buffer" class="ma-morse-display" style="border: none; padding: 0.25rem 0; min-height: 32px;">
                                    <span class="ma-text--muted" style="font-size: 0.875rem;">Key a dot or dash...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Decoded Output Text -->
                        <div style="margin-bottom: 0.75rem;">
                            <label class="ma-label" for="decoded-output">Decoded Transmission Stream</label>
                            <div id="decoded-output" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1rem; min-height: 80px; font-family: 'Courier New', Courier, monospace; font-size: 1.25rem; color: var(--text-primary); word-break: break-all; white-space: pre-wrap; letter-spacing: 0.05em;"></div>
                        </div>

                        <!-- Spacing & Error Notification -->
                        <div id="spacing-feedback" class="ma-text--muted" style="font-size: 0.8125rem; min-height: 20px;">
                            Timing calibration: nominal dot = <span id="nominal-dot-time">80ms</span>, dash = <span id="nominal-dash-time">240ms</span>.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Stats & Metrics Strip -->
            <div class="ma-card">
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--4col" style="text-align: center;">
                        <div>
                            <div class="ma-stat-value" id="stat-measured-wpm">0.0</div>
                            <div class="ma-stat-label">Measured Speed (WPM)</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="stat-accuracy">100%</div>
                            <div class="ma-stat-label">Accuracy vs Target</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="stat-chars-sent">0</div>
                            <div class="ma-stat-label">Characters Sent</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="stat-dits-dahs">0 / 0</div>
                            <div class="ma-stat-label">Dits / Dahs</div>
                        </div>
                    </div>
                </div>
                <div class="ma-card__footer" style="justify-content: space-between;">
                    <div id="session-summary-text" class="ma-text--muted" style="font-size: 0.875rem;">
                        Session active. Press key to begin sending.
                    </div>
                    <button id="save-session-btn" class="ma-btn ma-btn--primary ma-btn--sm">
                        💾 Save Practice Session
                    </button>
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
}

function attachEventListeners() {
    if (!containerRef) return;

    // Controls
    const wpmInput = containerRef.querySelector('#sending-wpm');
    const wpmDisplay = containerRef.querySelector('#wpm-display');
    const freqInput = containerRef.querySelector('#sending-freq');
    const freqDisplay = containerRef.querySelector('#freq-display');
    const keyModeSelect = containerRef.querySelector('#sending-key-mode');
    const practiceModeSelect = containerRef.querySelector('#sending-practice-mode');
    const clearBtn = containerRef.querySelector('#clear-text-btn');
    const copyBtn = containerRef.querySelector('#copy-text-btn');
    const saveBtn = containerRef.querySelector('#save-session-btn');

    if (wpmInput) {
        wpmInput.addEventListener('input', (e) => {
            config.targetWpm = parseInt(e.target.value, 10);
            if (wpmDisplay) wpmDisplay.textContent = config.targetWpm;
            updateNominalTimes();
        });
    }

    if (freqInput) {
        freqInput.addEventListener('input', (e) => {
            config.frequency = parseInt(e.target.value, 10);
            if (freqDisplay) freqDisplay.textContent = `${config.frequency} Hz`;
            if (sidetoneOsc && audioCtx) {
                try {
                    sidetoneOsc.frequency.setValueAtTime(config.frequency, audioCtx.currentTime);
                } catch (err) {}
            }
        });
    }

    if (keyModeSelect) {
        keyModeSelect.addEventListener('change', (e) => {
            config.keyMode = e.target.value;
            const straightArea = containerRef.querySelector('#straight-key-area');
            const paddleArea = containerRef.querySelector('#paddle-key-area');
            const modeBadge = containerRef.querySelector('#sending-mode-badge');
            const keyTitle = containerRef.querySelector('#key-title');

            if (config.keyMode === 'straight') {
                if (straightArea) straightArea.style.display = 'block';
                if (paddleArea) paddleArea.style.display = 'none';
                if (modeBadge) modeBadge.textContent = 'Mode: Straight Key';
                if (keyTitle) keyTitle.textContent = 'Straight Key Station';
            } else {
                if (straightArea) straightArea.style.display = 'none';
                if (paddleArea) paddleArea.style.display = 'flex';
                if (modeBadge) modeBadge.textContent = 'Mode: Iambic Paddle';
                if (keyTitle) keyTitle.textContent = 'Iambic Paddle Station';
            }
        });
    }

    if (practiceModeSelect) {
        practiceModeSelect.addEventListener('change', (e) => {
            config.practiceMode = e.target.value;
            const targetContainer = containerRef.querySelector('#target-prompt-container');
            if (targetContainer) {
                targetContainer.style.display = config.practiceMode === 'free' ? 'none' : 'block';
            }
            if (config.practiceMode !== 'free') {
                pickNewTarget();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            decodedText = '';
            currentMorseBuffer = '';
            renderDecodedText();
            updateSymbolBuffer();
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (decodedText && navigator.clipboard) {
                navigator.clipboard.writeText(decodedText).then(() => {
                    if (window.Toast) window.Toast.success('Decoded text copied to clipboard!');
                }).catch(() => {});
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveSession);
    }

    // Straight Key Mouse / Touch handlers
    const keyBtn = containerRef.querySelector('#telegraph-key-btn');
    if (keyBtn) {
        const onDown = (e) => {
            e.preventDefault();
            startKeying();
        };
        const onUp = (e) => {
            e.preventDefault();
            stopKeying();
        };

        keyBtn.addEventListener('mousedown', onDown);
        keyBtn.addEventListener('mouseup', onUp);
        keyBtn.addEventListener('mouseleave', onUp);
        keyBtn.addEventListener('touchstart', onDown, { passive: false });
        keyBtn.addEventListener('touchend', onUp, { passive: false });
        keyBtn.addEventListener('touchcancel', onUp, { passive: false });
    }

    // Paddle Mouse / Touch handlers
    const ditBtn = containerRef.querySelector('#paddle-dit-btn');
    const dahBtn = containerRef.querySelector('#paddle-dah-btn');
    if (ditBtn && dahBtn) {
        const onDitDown = (e) => { e.preventDefault(); paddleDitDown = true; checkIambicKeyer(); };
        const onDitUp = (e) => { e.preventDefault(); paddleDitDown = false; };
        const onDahDown = (e) => { e.preventDefault(); paddleDahDown = true; checkIambicKeyer(); };
        const onDahUp = (e) => { e.preventDefault(); paddleDahDown = false; };

        ditBtn.addEventListener('mousedown', onDitDown);
        ditBtn.addEventListener('mouseup', onDitUp);
        ditBtn.addEventListener('mouseleave', onDitUp);
        ditBtn.addEventListener('touchstart', onDitDown, { passive: false });
        ditBtn.addEventListener('touchend', onDitUp, { passive: false });

        dahBtn.addEventListener('mousedown', onDahDown);
        dahBtn.addEventListener('mouseup', onDahUp);
        dahBtn.addEventListener('mouseleave', onDahUp);
        dahBtn.addEventListener('touchstart', onDahDown, { passive: false });
        dahBtn.addEventListener('touchend', onDahUp, { passive: false });
    }

    // Web Serial / Gamepad Detection
    checkExternalHardware();
}

function updateNominalTimes() {
    if (!containerRef) return;
    const dot = Math.round(1200 / config.targetWpm);
    const dash = dot * 3;
    const dotEl = containerRef.querySelector('#nominal-dot-time');
    const dashEl = containerRef.querySelector('#nominal-dash-time');
    if (dotEl) dotEl.textContent = `${dot}ms`;
    if (dashEl) dashEl.textContent = `${dash}ms`;
}

function checkExternalHardware() {
    if (!containerRef) return;
    const statusText = containerRef.querySelector('#serial-status-text');
    if (!statusText) return;

    if ('serial' in navigator) {
        statusText.innerHTML = `<span style="color: var(--accent-cyan);">Web Serial API Ready (USB/COM)</span>`;
    } else {
        statusText.textContent = `Keyboard & Mouse & Touch Active`;
    }
}

// Audio Engine Setup
function initSidetoneAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}

function toneOn() {
    initSidetoneAudio();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        if (!sidetoneGain) {
            sidetoneGain = audioCtx.createGain();
            sidetoneGain.gain.setValueAtTime(0, now);
            sidetoneGain.connect(audioCtx.destination);
        }

        if (!sidetoneOsc) {
            sidetoneOsc = audioCtx.createOscillator();
            sidetoneOsc.type = 'sine';
            sidetoneOsc.frequency.setValueAtTime(config.frequency, now);
            sidetoneOsc.connect(sidetoneGain);
            sidetoneOsc.start(now);
        }

        // 5ms smooth attack to avoid clicks
        sidetoneGain.gain.cancelScheduledValues(now);
        sidetoneGain.gain.setValueAtTime(sidetoneGain.gain.value, now);
        sidetoneGain.gain.linearRampToValueAtTime(config.volume, now + 0.005);
    } catch (e) {
        console.error('Tone on error:', e);
    }
}

function toneOff() {
    if (!audioCtx || !sidetoneGain) return;
    try {
        const now = audioCtx.currentTime;
        // 5ms smooth release to avoid clicks
        sidetoneGain.gain.cancelScheduledValues(now);
        sidetoneGain.gain.setValueAtTime(sidetoneGain.gain.value, now);
        sidetoneGain.gain.linearRampToValueAtTime(0, now + 0.005);
    } catch (e) {
        console.error('Tone off error:', e);
    }
}

// Keying Logic
function startKeying() {
    if (isKeyDown) return;
    isKeyDown = true;
    keyPressStartTime = performance.now();

    if (!sessionStats.startTime) {
        sessionStats.startTime = Date.now();
    }

    // Cancel pending inter-char & inter-word gaps
    if (interCharTimer) {
        clearTimeout(interCharTimer);
        interCharTimer = null;
    }
    if (interWordTimer) {
        clearTimeout(interWordTimer);
        interWordTimer = null;
    }

    // Measure release duration (spacing) if previous element existed
    if (keyReleaseStartTime > 0) {
        const releaseDur = keyPressStartTime - keyReleaseStartTime;
        analyzeInterElementSpacing(releaseDur);
    }

    // Turn tone on & UI active
    toneOn();
    const keyBtn = containerRef ? containerRef.querySelector('#telegraph-key-btn') : null;
    if (keyBtn) keyBtn.classList.add('active');

    const statusBadge = containerRef ? containerRef.querySelector('#timing-status') : null;
    if (statusBadge) {
        statusBadge.textContent = 'Transmitting';
        statusBadge.className = 'ma-badge ma-badge--success';
    }
}

function stopKeying() {
    if (!isKeyDown) return;
    isKeyDown = false;
    const pressEndTime = performance.now();
    keyReleaseStartTime = pressEndTime;
    const pressDuration = pressEndTime - keyPressStartTime;

    toneOff();
    const keyBtn = containerRef ? containerRef.querySelector('#telegraph-key-btn') : null;
    if (keyBtn) keyBtn.classList.remove('active');

    // Adaptive Dot / Dash discrimination based on Target WPM & recent user tempo
    const nominalDot = 1200 / config.targetWpm;
    const threshold = nominalDot * 2.0; // 2T boundary
    let symbol = '';

    if (pressDuration < threshold) {
        symbol = '.';
        sessionStats.ditsSent++;
        sessionStats.dotDurations.push(pressDuration);
    } else {
        symbol = '-';
        sessionStats.dahsSent++;
        sessionStats.dotDurations.push(pressDuration / 3);
    }

    // Keep rolling window of 25 dot timings for measured WPM calculation
    if (sessionStats.dotDurations.length > 25) {
        sessionStats.dotDurations.shift();
    }

    currentMorseBuffer += symbol;
    updateSymbolBuffer();
    updateLiveMetrics();

    // Schedule inter-character timeout (nominally 3T)
    const charGapTimeout = nominalDot * 3.0;
    const wordGapTimeout = nominalDot * 7.0;

    interCharTimer = setTimeout(() => {
        finalizeCurrentCharacter();
        // Once character finalized, schedule inter-word gap
        interWordTimer = setTimeout(() => {
            finalizeWord();
        }, wordGapTimeout - charGapTimeout);
    }, charGapTimeout);
}

function analyzeInterElementSpacing(releaseDur) {
    const nominalDot = 1200 / config.targetWpm;
    const feedback = containerRef ? containerRef.querySelector('#spacing-feedback') : null;
    if (!feedback) return;

    if (releaseDur < nominalDot * 0.4) {
        feedback.innerHTML = `<span style="color: var(--accent-amber);">⚠️ Spacing too fast (< 0.5T). Elements merging.</span>`;
    } else if (releaseDur > nominalDot * 2.5) {
        feedback.innerHTML = `<span style="color: var(--accent-cyan);">Note: Long pause treated as separate character.</span>`;
    } else {
        feedback.innerHTML = `<span style="color: var(--accent-green);">✓ Good element rhythm (${Math.round(releaseDur)}ms).</span>`;
    }
}

function finalizeCurrentCharacter() {
    if (!currentMorseBuffer) return;

    const engine = window.MorseEngine;
    const char = engine ? engine.morseToChar(currentMorseBuffer) : '?';
    const resolvedChar = char || '?';

    decodedText += resolvedChar;
    sessionStats.charsSent++;

    // Evaluate vs target prompt if in practice mode
    if (config.practiceMode !== 'free' && targetPrompt) {
        const expected = targetPrompt[promptIndex] || '';
        if (expected && expected.toUpperCase() === resolvedChar.toUpperCase()) {
            sessionStats.correctChars++;
            promptIndex++;
            if (promptIndex >= targetPrompt.length) {
                if (window.Toast) window.Toast.success(`🎉 Excellent! You completed "${targetPrompt}"!`);
                setTimeout(pickNewTarget, 600);
            }
        } else {
            sessionStats.errors.push({ expected, got: resolvedChar });
            if (window.Toast) window.Toast.warning(`Mismatched: Expected "${expected}", sent "${resolvedChar}"`);
        }
    }

    currentMorseBuffer = '';
    renderDecodedText();
    updateSymbolBuffer();
    updateLiveMetrics();

    const livePreview = containerRef ? containerRef.querySelector('#live-char-preview') : null;
    if (livePreview) livePreview.textContent = resolvedChar;

    const statusBadge = containerRef ? containerRef.querySelector('#timing-status') : null;
    if (statusBadge) {
        statusBadge.textContent = 'Ready';
        statusBadge.className = 'ma-badge ma-badge--info';
    }
}

function finalizeWord() {
    if (decodedText.length > 0 && !decodedText.endsWith(' ')) {
        decodedText += ' ';
        renderDecodedText();
    }
}

function updateSymbolBuffer() {
    if (!containerRef) return;
    const bufferEl = containerRef.querySelector('#live-symbol-buffer');
    if (!bufferEl) return;

    if (!currentMorseBuffer) {
        bufferEl.innerHTML = `<span class="ma-text--muted" style="font-size: 0.875rem;">Waiting for key...</span>`;
        return;
    }

    let html = '';
    for (const sym of currentMorseBuffer) {
        if (sym === '.') {
            html += `<span class="ma-dot" style="margin-right: 4px;"></span>`;
        } else if (sym === '-') {
            html += `<span class="ma-dash" style="margin-right: 4px;"></span>`;
        }
    }
    bufferEl.innerHTML = html;
}

function renderDecodedText() {
    if (!containerRef) return;
    const out = containerRef.querySelector('#decoded-output');
    if (!out) return;
    out.textContent = decodedText || ' ';

    // Auto-scroll to end
    out.scrollTop = out.scrollHeight;
}

function updateLiveMetrics() {
    if (!containerRef) return;

    // Measured WPM from rolling average of dots
    let measuredWpm = 0;
    if (sessionStats.dotDurations.length > 0) {
        const sum = sessionStats.dotDurations.reduce((a, b) => a + b, 0);
        const avgDot = sum / sessionStats.dotDurations.length;
        if (avgDot > 0) {
            measuredWpm = Math.min(60, Math.max(1, 1200 / avgDot));
        }
    }

    const wpmEl = containerRef.querySelector('#stat-measured-wpm');
    if (wpmEl) wpmEl.textContent = measuredWpm > 0 ? measuredWpm.toFixed(1) : '0.0';

    const charsEl = containerRef.querySelector('#stat-chars-sent');
    if (charsEl) charsEl.textContent = sessionStats.charsSent;

    const ditsDahsEl = containerRef.querySelector('#stat-dits-dahs');
    if (ditsDahsEl) ditsDahsEl.textContent = `${sessionStats.ditsSent} / ${sessionStats.dahsSent}`;

    const accEl = containerRef.querySelector('#stat-accuracy');
    if (accEl) {
        if (config.practiceMode === 'free') {
            accEl.textContent = '100%';
        } else {
            const total = sessionStats.charsSent;
            const pct = total > 0 ? Math.round((sessionStats.correctChars / total) * 100) : 100;
            accEl.textContent = `${pct}%`;
        }
    }
}

function pickNewTarget() {
    promptIndex = 0;
    const words = ['CQ', 'HELLO', 'RADIO', 'MORSE', '73', 'PARIS', 'ANTENNA', 'SIGNAL', 'ROGER', 'TEST'];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    if (config.practiceMode === 'chars') {
        targetPrompt = alphabet[Math.floor(Math.random() * alphabet.length)];
    } else {
        targetPrompt = words[Math.floor(Math.random() * words.length)];
    }

    if (containerRef) {
        const promptEl = containerRef.querySelector('#target-prompt-display');
        const morseEl = containerRef.querySelector('#target-morse-display');
        if (promptEl) promptEl.textContent = targetPrompt;
        if (morseEl && window.MorseEngine) {
            morseEl.textContent = window.MorseEngine.textToMorse(targetPrompt);
        }
    }
}

// Iambic Paddle Keyer Loop
function checkIambicKeyer() {
    if (config.keyMode !== 'iambic-a') return;
    if (iambicInterval) return;

    const dotDuration = 1200 / config.targetWpm;

    const step = () => {
        if (!paddleDitDown && !paddleDahDown) {
            iambicInterval = null;
            return;
        }

        if (paddleDitDown) {
            // Emit a dit
            startKeying();
            setTimeout(() => {
                stopKeying();
                setTimeout(step, dotDuration); // 1T space
            }, dotDuration); // 1T dit
        } else if (paddleDahDown) {
            // Emit a dah
            startKeying();
            setTimeout(() => {
                stopKeying();
                setTimeout(step, dotDuration); // 1T space
            }, dotDuration * 3); // 3T dah
        }
    };

    iambicInterval = setTimeout(step, 0);
}

// Keyboard Event Handlers
function handleKeyDown(e) {
    // Avoid re-triggering if typing in another input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }

    if (config.keyMode === 'straight') {
        const isTargetKey = (config.keyBinding === 'Space' && e.code === 'Space') ||
                            (e.key && e.key.toLowerCase() === config.keyBinding.toLowerCase());
        if (isTargetKey) {
            e.preventDefault();
            startKeying();
        }
    } else {
        // Paddle mode: [ = dit, ] = dah
        if (e.code === 'BracketLeft' || e.key === '[') {
            e.preventDefault();
            paddleDitDown = true;
            checkIambicKeyer();
        } else if (e.code === 'BracketRight' || e.key === ']') {
            e.preventDefault();
            paddleDahDown = true;
            checkIambicKeyer();
        }
    }
}

function handleKeyUp(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }

    if (config.keyMode === 'straight') {
        const isTargetKey = (config.keyBinding === 'Space' && e.code === 'Space') ||
                            (e.key && e.key.toLowerCase() === config.keyBinding.toLowerCase());
        if (isTargetKey) {
            e.preventDefault();
            stopKeying();
        }
    } else {
        if (e.code === 'BracketLeft' || e.key === '[') {
            paddleDitDown = false;
        } else if (e.code === 'BracketRight' || e.key === ']') {
            paddleDahDown = false;
        }
    }
}

// Oscilloscope Rendering Loop
function startOscilloscope() {
    const canvas = containerRef ? containerRef.querySelector('#oscilloscope-canvas') : null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
        if (!containerRef) return;
        animFrameId = requestAnimationFrame(draw);

        const now = performance.now();
        oscilloscopeData.push({ time: now, active: isKeyDown });

        // Retain last 3 seconds of waveform
        while (oscilloscopeData.length > 0 && now - oscilloscopeData[0].time > 3000) {
            oscilloscopeData.shift();
        }

        const width = canvas.width;
        const height = canvas.height;

        // Background
        ctx.fillStyle = '#060911';
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = '#141d2f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = 15; y < height; y += 20) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        if (oscilloscopeData.length < 2) return;

        // Draw CW pulse train
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#22d3ee';
        ctx.beginPath();

        const windowMs = 3000;
        const baselineY = height - 15;
        const pulseY = 18;

        for (let i = 0; i < oscilloscopeData.length; i++) {
            const pt = oscilloscopeData[i];
            const age = now - pt.time;
            const x = width - (age / windowMs) * width;
            const y = pt.active ? pulseY : baselineY;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    };

    draw();
}

function saveSession() {
    if (!sessionStats.charsSent && !sessionStats.ditsSent) {
        if (window.Toast) window.Toast.info('Send a few characters before saving session.');
        return;
    }

    const durationSec = sessionStats.startTime ? Math.max(1, Math.round((Date.now() - sessionStats.startTime) / 1000)) : 10;
    const total = sessionStats.charsSent;
    const accuracy = total > 0 ? Math.round((sessionStats.correctChars / total) * 100) : 100;

    let measuredWpm = config.targetWpm;
    if (sessionStats.dotDurations.length > 0) {
        const sum = sessionStats.dotDurations.reduce((a, b) => a + b, 0);
        measuredWpm = Math.round(1200 / (sum / sessionStats.dotDurations.length));
    }

    const sessionData = {
        type: 'sending',
        wpm: measuredWpm,
        accuracy: accuracy,
        duration: durationSec,
        details: {
            mode: config.practiceMode,
            keyMode: config.keyMode,
            charsSent: sessionStats.charsSent,
            dits: sessionStats.ditsSent,
            dahs: sessionStats.dahsSent,
            decodedText: decodedText.slice(0, 100)
        },
        created_at: new Date().toISOString()
    };

    if (window.AppState) {
        window.AppState.updateStats({
            sessions: (window.AppState.getStats().sessions || 0) + 1,
            totalTime: (window.AppState.getStats().totalTime || 0) + durationSec,
            history: [sessionData]
        });
    }

    if (window.MorseAPI) {
        window.MorseAPI.post('practice/session', sessionData).catch(() => {});
    }

    if (window.Toast) {
        window.Toast.success(`Session saved! Measured speed: ${measuredWpm} WPM (${accuracy}% accuracy)`);
    }
}

// Lifecycle Hooks
export function init() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    startOscilloscope();
    updateNominalTimes();

    if (config.practiceMode !== 'free') {
        pickNewTarget();
    }
}

export function destroy() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    if (interCharTimer) clearTimeout(interCharTimer);
    if (interWordTimer) clearTimeout(interWordTimer);
    if (iambicInterval) clearTimeout(iambicInterval);

    toneOff();

    if (sidetoneOsc) {
        try {
            sidetoneOsc.stop();
            sidetoneOsc.disconnect();
        } catch (e) {}
        sidetoneOsc = null;
    }

    if (sidetoneGain) {
        try {
            sidetoneGain.disconnect();
        } catch (e) {}
        sidetoneGain = null;
    }

    containerRef = null;
    oscilloscopeData = [];
    currentMorseBuffer = '';
}
