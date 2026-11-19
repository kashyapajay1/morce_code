// Morse Academy — CW Radio Communication Simulator
// Realistic HF transceiver simulation with Web Audio atmospheric physics (QRN, QSB, QRM)

let containerRef = null;

// Web Audio atmospheric engine
let audioCtx = null;
let noiseNode = null;
let noiseGain = null;
let noiseFilter = null;
let qrmOsc = null;
let qrmGain = null;
let qsbLfo = null;
let qsbGain = null;
let rxSignalGain = null;

// Simulator State
let currentBand = '20m'; // 80m, 40m, 20m, 15m, 10m
let currentFreq = '14.025.00';
let userCallsign = 'W1AW';
let aiStation = {
    call: 'DL7NDR',
    name: 'HANS',
    qth: 'BERLIN',
    rst: '599',
    rig: '100W DIPOLE'
};
let qsoStep = 0; // 0 = Standby/Ready, 1 = CQ sent, 2 = Contact active, 3 = Completed
let qsoHistory = []; // [{ from, text, time }]
let isTransmitting = false;

// Audio Environment Settings
let envConfig = {
    qrnNoise: 0.15,     // Background static (0 - 1)
    qsbFading: true,    // Atmospheric fading LFO
    qrmInterference: 0, // Adjacent channel interference (0 - 1)
    signalStrength: 7,  // S-Meter (1 to 9, 10 for S9+20)
    wpm: 18,
    pitch: 650
};

const BANDS = {
    '80m': '3.525.00',
    '40m': '7.025.00',
    '20m': '14.025.00',
    '15m': '21.025.00',
    '10m': '28.025.00'
};

const Q_CODES_REF = [
    { code: 'QTH', meaning: 'My location is...' },
    { code: 'QSL', meaning: 'I acknowledge receipt / confirm' },
    { code: 'QRM', meaning: 'I am being interfered with' },
    { code: 'QRN', meaning: 'I am troubled by static noise' },
    { code: 'QRZ', meaning: 'Who is calling me?' },
    { code: 'QSO', meaning: 'A direct two-way radio contact' },
    { code: 'QSY', meaning: 'Change frequency to...' },
    { code: 'QRV', meaning: 'I am ready' },
    { code: 'QRT', meaning: 'Stop transmitting / closing station' },
    { code: 'QRS', meaning: 'Send more slowly' },
    { code: 'QRQ', meaning: 'Send more quickly' },
    { code: 'QSB', meaning: 'Your signal is fading' },
    { code: 'QRP', meaning: 'Low power transmission (<= 5W)' },
    { code: 'QRO', meaning: 'Increase power' },
    { code: 'QRX', meaning: 'Stand by / wait' },
    { code: '73',  meaning: 'Best regards (friendly signoff)' }
];

export function render(container) {
    containerRef = container;

    // Load callsign from settings if present
    if (window.AppState) {
        const s = window.AppState.getSettings();
        if (s.callsign) userCallsign = s.callsign;
    }

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">📻 HF Transceiver CW Simulator</h1>
                        <p class="ma-text">Experience authentic high-frequency amateur radio telegraphy with real-world atmospheric noise, fading, and live QSO exchanges.</p>
                    </div>
                    <div class="ma-flex" style="gap: 0.5rem; align-items: center;">
                        <span class="ma-badge ma-badge--success" id="transceiver-power-badge">POWER ON</span>
                        <span class="ma-badge ma-badge--info">OP: <strong id="operator-call-badge">${userCallsign}</strong></span>
                    </div>
                </div>
            </header>

            <!-- Vintage Transceiver Console Faceplate -->
            <div class="ma-card" style="margin-bottom: 1.5rem; background: linear-gradient(180deg, #161e2e 0%, #0d131f 100%); border: 2px solid #2a364f; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                <div class="ma-card__header" style="border-bottom: 1px solid #2a364f; padding: 0.75rem 1.5rem; background: rgba(0,0,0,0.2);">
                    <span style="font-weight: 800; letter-spacing: 0.1em; color: var(--accent-cyan);">YAESU-STYLE HF CW TRANSCEIVER // MODEL MA-2026</span>
                    <div class="ma-flex" style="gap: 0.5rem;">
                        <button id="btn-power-toggle" class="ma-btn ma-btn--ghost ma-btn--sm" style="color: var(--accent-green);">● RX ACTIVE</button>
                    </div>
                </div>
                <div class="ma-card__body" style="padding: 1.5rem;">
                    <div class="ma-grid ma-grid--3col" style="gap: 1.5rem; align-items: center;">
                        <!-- VFO Main Frequency Display -->
                        <div style="background: #05080f; border: 2px solid #25334d; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);">
                            <span class="ma-stat-label" style="color: var(--accent-cyan); font-size: 0.75rem; letter-spacing: 0.15em;">VFO-A MAIN FREQUENCY</span>
                            <div id="vfo-frequency-display" style="font-size: 2.5rem; font-weight: 800; font-family: 'Courier New', Courier, monospace; color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.6); margin: 0.25rem 0;">
                                ${currentFreq}
                            </div>
                            <div class="ma-flex" style="justify-content: center; gap: 0.5rem; margin-top: 0.5rem;">
                                ${['80m', '40m', '20m', '15m', '10m'].map(b => `
                                    <button class="ma-btn ${b === currentBand ? 'ma-btn--primary' : 'ma-btn--ghost'} ma-btn--sm band-select-btn" data-band="${b}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                        ${b}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Analog S-Meter -->
                        <div style="background: #05080f; border: 2px solid #25334d; border-radius: 8px; padding: 1rem; text-align: center; position: relative;">
                            <span class="ma-stat-label" style="font-size: 0.7rem;">SIGNAL STRENGTH / S-METER</span>
                            <!-- S-Meter Scale -->
                            <div style="display: flex; justify-content: space-between; font-size: 0.6875rem; color: var(--text-muted); font-family: monospace; padding: 0 10px; margin-top: 0.5rem;">
                                <span>S1</span><span>S3</span><span>S5</span><span>S7</span><span>S9</span><span style="color: var(--accent-red);">+20dB</span>
                            </div>
                            <div style="height: 14px; background: #111827; border-radius: 7px; overflow: hidden; margin: 0.5rem 0; border: 1px solid #1f293d;">
                                <div id="s-meter-needle" style="width: 70%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #38bdf8 65%, #ef4444 100%); transition: width 0.2s ease;"></div>
                            </div>
                            <div id="s-meter-readout" style="font-size: 0.875rem; font-weight: 700; color: var(--accent-cyan); font-family: monospace;">
                                S7 (Solid Copy)
                            </div>
                        </div>

                        <!-- Atmospheric Controls (QRN, QSB, QRM) -->
                        <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 1rem;">
                            <span class="ma-stat-label" style="font-size: 0.75rem; margin-bottom: 0.75rem;">RF ENVIRONMENT & PROPAGATION</span>

                            <!-- QRN Static Slider -->
                            <div style="margin-bottom: 0.5rem;">
                                <div class="ma-flex" style="justify-content: space-between; font-size: 0.75rem;">
                                    <span>QRN (Atmospheric Static):</span>
                                    <strong id="qrn-val-label">${Math.round(envConfig.qrnNoise * 100)}%</strong>
                                </div>
                                <input type="range" id="sim-qrn-slider" class="ma-range" min="0" max="100" value="${envConfig.qrnNoise * 100}">
                            </div>

                            <!-- QRM Interference Slider -->
                            <div style="margin-bottom: 0.5rem;">
                                <div class="ma-flex" style="justify-content: space-between; font-size: 0.75rem;">
                                    <span>QRM (Adjacent Carrier Tone):</span>
                                    <strong id="qrm-val-label">${Math.round(envConfig.qrmInterference * 100)}%</strong>
                                </div>
                                <input type="range" id="sim-qrm-slider" class="ma-range" min="0" max="100" value="${envConfig.qrmInterference * 100}">
                            </div>

                            <!-- QSB Fading Toggle -->
                            <div class="ma-flex" style="justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                                <span style="font-size: 0.75rem;">QSB (Ionospheric Fading LFO):</span>
                                <input type="checkbox" id="sim-qsb-toggle" ${envConfig.qsbFading ? 'checked' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Two-Way Simulated QSO Workspace -->
            <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 1.5rem;">
                <!-- Left: Live QSO Transcript & Dialogue -->
                <div class="ma-card" style="display: flex; flex-direction: column;">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">📻 Live Contact Frequency Log</h3>
                        <div class="ma-flex" style="gap: 0.5rem;">
                            <button id="btn-call-cq" class="ma-btn ma-btn--secondary ma-btn--sm">📢 Call CQ</button>
                            <button id="btn-listen-cq" class="ma-btn ma-btn--primary ma-btn--sm">🎧 Listen for CQ</button>
                        </div>
                    </div>
                    <div class="ma-card__body" style="flex: 1; display: flex; flex-direction: column;">
                        <!-- Transcript Log Window -->
                        <div id="qso-log-window" style="background: #040711; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 1rem; flex: 1; min-height: 240px; max-height: 320px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9375rem; line-height: 1.6;">
                            <div class="ma-text--muted" style="font-size: 0.8125rem;">
                                [${currentFreq} MHz] Receiver active. Tuning across band... Click "Call CQ" or "Listen for CQ" to initiate a contact.
                            </div>
                        </div>

                        <!-- Current Station Contact Banner -->
                        <div id="qso-station-info" style="margin-top: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); padding: 0.75rem 1rem; font-size: 0.875rem;">
                            <div class="ma-flex" style="justify-content: space-between;">
                                <span>Target Station: <strong id="qso-target-call" style="color: var(--accent-cyan);">${aiStation.call}</strong></span>
                                <span>QTH: <strong id="qso-target-qth">${aiStation.qth}</strong></span>
                                <span>OP: <strong id="qso-target-name">${aiStation.name}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right: Operator Transmitter & Interactive Controls -->
                <div class="ma-card" style="display: flex; flex-direction: column;">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">Operator Transmitter & Keyer</h3>
                        <span id="tx-status-badge" class="ma-badge ma-badge--info">Standby</span>
                    </div>
                    <div class="ma-card__body">
                        <!-- Quick Response QSO Macros -->
                        <div style="margin-bottom: 1.25rem;">
                            <label class="ma-label">Amateur Radio QSO Action Buttons</label>
                            <div class="ma-grid ma-grid--2col" style="gap: 0.5rem;">
                                <button class="ma-btn ma-btn--ghost ma-btn--sm qso-macro-btn" data-text="CQ CQ CQ DE ${userCallsign} ${userCallsign} K">
                                    1. Send CQ Call
                                </button>
                                <button class="ma-btn ma-btn--ghost ma-btn--sm qso-macro-btn" data-text="${aiStation.call} DE ${userCallsign} UR RST 599 5NN HR NAME BOB QTH BOSTON K">
                                    2. Send Report & QTH
                                </button>
                                <button class="ma-btn ma-btn--ghost ma-btn--sm qso-macro-btn" data-text="${aiStation.call} DE ${userCallsign} TNX FER QSO 73 SK">
                                    3. Send 73 & Farewell
                                </button>
                                <button class="ma-btn ma-btn--ghost ma-btn--sm qso-macro-btn" data-text="QRZ? DE ${userCallsign} K">
                                    4. Send QRZ?
                                </button>
                            </div>
                        </div>

                        <!-- Manual Text Transmitter Input -->
                        <div style="margin-bottom: 1.25rem;">
                            <label class="ma-label" for="tx-message-input">Manual Text Transmission</label>
                            <div class="ma-flex" style="gap: 0.5rem;">
                                <input type="text" id="tx-message-input" class="ma-input" placeholder="Type text to transmit over the air..." style="font-family: monospace; text-transform: uppercase;">
                                <button id="btn-transmit-text" class="ma-btn ma-btn--primary" style="white-space: nowrap;">
                                    📡 Send CW
                                </button>
                            </div>
                        </div>

                        <!-- Straight Key Tap for Live CW Keying -->
                        <div style="text-align: center; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                            <div class="ma-stat-label">MANUAL KEYING OVER FREQUENCY</div>
                            <div id="sim-telegraph-key" class="ma-telegraph-key" style="width: 100px; height: 100px; margin: 0.75rem auto;" tabindex="0" role="button">
                                <span>TX</span>
                                <small style="font-size: 0.6875rem;">KEY</small>
                            </div>
                            <span class="ma-text--muted" style="font-size: 0.75rem;">Hold Space or click to key transmitter directly.</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Q-Code Quick Reference Strip -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h3 class="ma-h3">Essential Amateur Radio Q-Codes & Signals</h3>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--4col" style="gap: 0.75rem;">
                        ${Q_CODES_REF.map(q => `
                            <div style="background: var(--bg-secondary); padding: 0.625rem 0.875rem; border-radius: 6px; border: 1px solid var(--border-color);">
                                <strong style="color: var(--accent-cyan); font-family: monospace;">${q.code}</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.25rem;">${q.meaning}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
    initAtmosphericAudio();
}

function attachEventListeners() {
    if (!containerRef) return;

    // Band select buttons
    const bandBtns = containerRef.querySelectorAll('.band-select-btn');
    bandBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentBand = e.currentTarget.getAttribute('data-band');
            currentFreq = BANDS[currentBand] || '14.025.00';
            const freqDisplay = containerRef.querySelector('#vfo-frequency-display');
            if (freqDisplay) freqDisplay.textContent = currentFreq;

            bandBtns.forEach(b => {
                b.className = b === e.currentTarget ? 'ma-btn ma-btn--primary ma-btn--sm band-select-btn' : 'ma-btn ma-btn--ghost ma-btn--sm band-select-btn';
            });

            appendLog(`[QSY] Tuned to ${currentBand} band (${currentFreq} MHz).`);
            randomizeAIStation();
        });
    });

    // Environmental controls
    const qrnSlider = containerRef.querySelector('#sim-qrn-slider');
    const qrnLabel = containerRef.querySelector('#qrn-val-label');
    if (qrnSlider) {
        qrnSlider.addEventListener('input', (e) => {
            envConfig.qrnNoise = parseInt(e.target.value, 10) / 100;
            if (qrnLabel) qrnLabel.textContent = `${Math.round(envConfig.qrnNoise * 100)}%`;
            if (noiseGain && audioCtx) {
                noiseGain.gain.setValueAtTime(envConfig.qrnNoise * 0.15, audioCtx.currentTime);
            }
        });
    }

    const qrmSlider = containerRef.querySelector('#sim-qrm-slider');
    const qrmLabel = containerRef.querySelector('#qrm-val-label');
    if (qrmSlider) {
        qrmSlider.addEventListener('input', (e) => {
            envConfig.qrmInterference = parseInt(e.target.value, 10) / 100;
            if (qrmLabel) qrmLabel.textContent = `${Math.round(envConfig.qrmInterference * 100)}%`;
            if (qrmGain && audioCtx) {
                qrmGain.gain.setValueAtTime(envConfig.qrmInterference * 0.05, audioCtx.currentTime);
            }
        });
    }

    const qsbToggle = containerRef.querySelector('#sim-qsb-toggle');
    if (qsbToggle) {
        qsbToggle.addEventListener('change', (e) => {
            envConfig.qsbFading = e.target.checked;
        });
    }

    // Call CQ Button
    const callCqBtn = containerRef.querySelector('#btn-call-cq');
    if (callCqBtn) {
        callCqBtn.addEventListener('click', () => {
            const cqMsg = `CQ CQ CQ DE ${userCallsign} ${userCallsign} K`;
            transmitOperatorText(cqMsg, () => {
                // After calling CQ, simulate an AI station responding after brief pause
                setTimeout(simulateAIReplyToCQ, 1800);
            });
        });
    }

    // Listen for CQ Button
    const listenCqBtn = containerRef.querySelector('#btn-listen-cq');
    if (listenCqBtn) {
        listenCqBtn.addEventListener('click', simulateAIStationCallingCQ);
    }

    // Macro Buttons
    const macroBtns = containerRef.querySelectorAll('.qso-macro-btn');
    macroBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.currentTarget.getAttribute('data-text');
            transmitOperatorText(text);
        });
    });

    // Manual Transmit text button
    const txBtn = containerRef.querySelector('#btn-transmit-text');
    const txInput = containerRef.querySelector('#tx-message-input');
    if (txBtn && txInput) {
        txBtn.addEventListener('click', () => {
            const txt = txInput.value.trim().toUpperCase();
            if (txt) {
                transmitOperatorText(txt);
                txInput.value = '';
            }
        });
        txInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const txt = txInput.value.trim().toUpperCase();
                if (txt) {
                    transmitOperatorText(txt);
                    txInput.value = '';
                }
            }
        });
    }

    // Manual Telegraph Key
    const simKey = containerRef.querySelector('#sim-telegraph-key');
    if (simKey) {
        simKey.addEventListener('mousedown', (e) => { e.preventDefault(); startManualTx(); });
        simKey.addEventListener('mouseup', (e) => { e.preventDefault(); stopManualTx(); });
        simKey.addEventListener('mouseleave', (e) => { e.preventDefault(); stopManualTx(); });
        simKey.addEventListener('touchstart', (e) => { e.preventDefault(); startManualTx(); }, { passive: false });
        simKey.addEventListener('touchend', (e) => { e.preventDefault(); stopManualTx(); }, { passive: false });
    }
}

// Atmospheric Web Audio Simulator
function initAtmosphericAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }

    try {
        // 1. Synthesize Atmospheric White/Pink Noise (QRN)
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            output[i] = (b0 + b1 + b2) * 0.2;
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        noiseNode.loop = true;

        // Bandpass filter centered around CW filter (650 Hz with 500 Hz Q)
        noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(650, audioCtx.currentTime);
        noiseFilter.Q.setValueAtTime(2.0, audioCtx.currentTime);

        noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(envConfig.qrnNoise * 0.1, audioCtx.currentTime);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseNode.start();

        // 2. QRM Adjacent Channel Interference (Sine at 800 Hz)
        qrmOsc = audioCtx.createOscillator();
        qrmOsc.type = 'sine';
        qrmOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
        qrmGain = audioCtx.createGain();
        qrmGain.gain.setValueAtTime(envConfig.qrmInterference * 0.05, audioCtx.currentTime);

        qrmOsc.connect(qrmGain);
        qrmGain.connect(audioCtx.destination);
        qrmOsc.start();
    } catch (e) {
        console.error('Atmospheric audio init error:', e);
    }
}

function randomizeAIStation() {
    const calls = [
        { call: 'DL7NDR', name: 'HANS', qth: 'BERLIN', rst: '599' },
        { call: 'JA1ABC', name: 'KEN', qth: 'TOKYO', rst: '589' },
        { call: 'G4ZFE', name: 'DAVE', qth: 'LONDON', rst: '599' },
        { call: 'VK3UM', name: 'RAY', qth: 'MELBOURNE', rst: '579' },
        { call: 'PY2XB', name: 'CARLOS', qth: 'SAO PAULO', rst: '589' },
        { call: 'VE3KRG', name: 'MARK', qth: 'TORONTO', rst: '599' }
    ];
    aiStation = calls[Math.floor(Math.random() * calls.length)];

    if (containerRef) {
        const cEl = containerRef.querySelector('#qso-target-call');
        const qEl = containerRef.querySelector('#qso-target-qth');
        const nEl = containerRef.querySelector('#qso-target-name');
        if (cEl) cEl.textContent = aiStation.call;
        if (qEl) qEl.textContent = aiStation.qth;
        if (nEl) nEl.textContent = aiStation.name;
    }
}

function appendLog(text, type = 'system') {
    if (!containerRef) return;
    const logWin = containerRef.querySelector('#qso-log-window');
    if (!logWin) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const row = document.createElement('div');
    row.style.marginBottom = '0.375rem';

    if (type === 'tx') {
        row.innerHTML = `<span style="color: var(--text-muted);">[${timeStr}]</span> <strong style="color: var(--accent-cyan);">TX (${userCallsign}):</strong> ${text}`;
    } else if (type === 'rx') {
        row.innerHTML = `<span style="color: var(--text-muted);">[${timeStr}]</span> <strong style="color: var(--accent-amber);">RX (${aiStation.call}):</strong> ${text}`;
    } else {
        row.innerHTML = `<span style="color: var(--text-muted);">[${timeStr}]</span> <em style="color: var(--accent-green);">${text}</em>`;
    }

    logWin.appendChild(row);
    logWin.scrollTop = logWin.scrollHeight;
}

function transmitOperatorText(text, callback) {
    if (!text || isTransmitting) return;
    isTransmitting = true;

    const statusBadge = containerRef ? containerRef.querySelector('#tx-status-badge') : null;
    if (statusBadge) {
        statusBadge.textContent = 'TRANSMITTING (TX)';
        statusBadge.className = 'ma-badge ma-badge--danger';
    }

    appendLog(text, 'tx');

    if (window.MorseAudio) {
        window.MorseAudio.init();
        window.MorseAudio.playSequence(text, {
            wpm: envConfig.wpm,
            frequency: envConfig.pitch,
            volume: 0.8,
            onComplete: () => {
                isTransmitting = false;
                if (statusBadge) {
                    statusBadge.textContent = 'Standby (RX)';
                    statusBadge.className = 'ma-badge ma-badge--info';
                }
                if (callback) callback();
            }
        });
    } else {
        isTransmitting = false;
        if (callback) callback();
    }
}

function simulateAIStationCallingCQ() {
    randomizeAIStation();
    const msg = `CQ CQ CQ DE ${aiStation.call} ${aiStation.call} K`;
    playIncomingTransmission(msg, () => {
        appendLog(`Signal detected from ${aiStation.call}! Reply using macro or transmit: "${aiStation.call} DE ${userCallsign} K"`);
    });
}

function simulateAIReplyToCQ() {
    const msg = `${userCallsign} DE ${aiStation.call} GM UR RST ${aiStation.rst} ${aiStation.rst} NAME ${aiStation.name} QTH ${aiStation.qth} HW CPY? BK`;
    playIncomingTransmission(msg);
}

function playIncomingTransmission(text, callback) {
    appendLog(text, 'rx');

    // Modulate S-Meter to signal strength S8-S9
    const sMeter = containerRef ? containerRef.querySelector('#s-meter-needle') : null;
    if (sMeter) sMeter.style.width = '85%';

    if (window.MorseAudio) {
        window.MorseAudio.init();
        window.MorseAudio.playSequence(text, {
            wpm: envConfig.wpm - 2,
            frequency: envConfig.pitch - 50, // Slight pitch offset for realistic heterodyne
            volume: 0.65,
            onComplete: () => {
                if (sMeter) sMeter.style.width = '45%';
                if (callback) callback();
            }
        });
    } else {
        if (callback) callback();
    }
}

// Manual Keying implementation
let manualOsc = null;
let manualGain = null;

function startManualTx() {
    if (!audioCtx) initAtmosphericAudio();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        if (!manualGain) {
            manualGain = audioCtx.createGain();
            manualGain.gain.setValueAtTime(0, now);
            manualGain.connect(audioCtx.destination);
        }
        if (!manualOsc) {
            manualOsc = audioCtx.createOscillator();
            manualOsc.type = 'sine';
            manualOsc.frequency.setValueAtTime(envConfig.pitch, now);
            manualOsc.connect(manualGain);
            manualOsc.start(now);
        }

        manualGain.gain.cancelScheduledValues(now);
        manualGain.gain.setValueAtTime(manualGain.gain.value, now);
        manualGain.gain.linearRampToValueAtTime(0.7, now + 0.005);

        const key = containerRef ? containerRef.querySelector('#sim-telegraph-key') : null;
        if (key) key.classList.add('active');
    } catch (e) {}
}

function stopManualTx() {
    if (!audioCtx || !manualGain) return;
    try {
        const now = audioCtx.currentTime;
        manualGain.gain.cancelScheduledValues(now);
        manualGain.gain.setValueAtTime(manualGain.gain.value, now);
        manualGain.gain.linearRampToValueAtTime(0, now + 0.005);

        const key = containerRef ? containerRef.querySelector('#sim-telegraph-key') : null;
        if (key) key.classList.remove('active');
    } catch (e) {}
}

function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
        e.preventDefault();
        startManualTx();
    }
}

function handleKeyUp(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
        e.preventDefault();
        stopManualTx();
    }
}

export function init() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

export function destroy() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    if (window.MorseAudio) window.MorseAudio.stop();

    if (noiseNode) {
        try { noiseNode.stop(); noiseNode.disconnect(); } catch (e) {}
        noiseNode = null;
    }
    if (qrmOsc) {
        try { qrmOsc.stop(); qrmOsc.disconnect(); } catch (e) {}
        qrmOsc = null;
    }
    if (manualOsc) {
        try { manualOsc.stop(); manualOsc.disconnect(); } catch (e) {}
        manualOsc = null;
    }

    containerRef = null;
    isTransmitting = false;
}
