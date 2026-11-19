// Morse Academy — Ham Radio Exam Centre
// Comprehensive practice examination simulator for amateur radio Morse certification

let containerRef = null;
let examTimer = null;
let timeLeft = 60;
let examActive = false;
let examMode = 'receiving'; // 'receiving' | 'sending'
let examWpm = 8;
let examDuration = 60; // 60, 120, 180, 300
let examContentType = 'five-char';
let examContent = '';
let userTranscription = '';

// Sending mode state
let sendingStartTime = 0;
let sendingDecoded = '';
let sendingKeyActive = false;
let sidetoneAudio = null;

const MOCK_CALLSIGNS = [
    'W1AW', 'K6STI', 'N4ZR', 'G4ZFE', 'VK3UM', 'JA1ABC', 'DL7NDR', 'F5IN',
    'PY2XB', 'VE3KRG', 'ZL2AGY', 'EA4TX', 'I2WIJ', 'SM5AJV', 'OH2BB', 'ON4UN'
];

export function render(container) {
    containerRef = container;

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">📝 Ham Radio Morse Code Exam Centre</h1>
                        <p class="ma-text">Test your Morse code proficiency under formal examination conditions with automated marking.</p>
                    </div>
                    <div>
                        <span class="ma-badge ma-badge--warning" style="font-size: 0.8125rem;">
                            8 WPM Standard Preset Available
                        </span>
                    </div>
                </div>
            </header>

            <!-- Prominent Mandatory Disclaimer Banner -->
            <div class="ma-card" style="margin-bottom: 1.5rem; border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.05);">
                <div class="ma-card__body" style="padding: 1rem 1.25rem;">
                    <div class="ma-flex" style="gap: 0.75rem; align-items: center;">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <div style="font-size: 0.875rem; color: var(--text-primary);">
                            <strong>Practice Simulator Only:</strong> This simulator provides realistic ham radio Morse code examination practice. It is not an official examination issued by any government agency (e.g. FCC, RSGB, WPC, ITU) or licensing authority.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Exam Setup Screen (When not actively running) -->
            <div id="exam-setup-card" class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__header">
                    <h3 class="ma-h3">Examination Configuration</h3>
                    <button id="btn-quick-8wpm" class="ma-btn ma-btn--secondary ma-btn--sm">
                        ⭐ Load Standard 8 WPM Exam
                    </button>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--4col" style="gap: 1.25rem;">
                        <div>
                            <label class="ma-label" for="exam-mode-select">Exam Discipline</label>
                            <select id="exam-mode-select" class="ma-select">
                                <option value="receiving" selected>Receiving Exam (Copy Test)</option>
                                <option value="sending">Sending Exam (Keying Test)</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="exam-wpm-select">Speed Standard</label>
                            <select id="exam-wpm-select" class="ma-select">
                                <option value="5">5 WPM (Introductory)</option>
                                <option value="8" selected>8 WPM (Standard Ham Preset)</option>
                                <option value="10">10 WPM (Intermediate)</option>
                                <option value="12">12 WPM (FCC Element 1C)</option>
                                <option value="15">15 WPM (General Class)</option>
                                <option value="20">20 WPM (Commercial / Extra)</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="exam-content-select">Content Type</label>
                            <select id="exam-content-select" class="ma-select">
                                <option value="five-char" selected>5-Character Groups</option>
                                <option value="random-chars">Random Character Sequences</option>
                                <option value="callsigns">Amateur Radio Callsigns</option>
                                <option value="numbers">Numeric Groups</option>
                                <option value="mixed">Mixed (Letters, Numbers & Prosigns)</option>
                            </select>
                        </div>
                        <div>
                            <label class="ma-label" for="exam-duration-select">Test Duration</label>
                            <select id="exam-duration-select" class="ma-select">
                                <option value="60" selected>1 Minute (60s)</option>
                                <option value="120">2 Minutes (120s)</option>
                                <option value="180">3 Minutes (180s)</option>
                                <option value="300">5 Minutes (300s Standard)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="ma-card__footer" style="justify-content: space-between;">
                    <div class="ma-text--muted" style="font-size: 0.875rem;">
                        Passing Requirement: <strong>≥ 85% accuracy</strong> on received text.
                    </div>
                    <button id="exam-start-btn" class="ma-btn ma-btn--primary ma-btn--lg">
                        🚀 Begin Examination
                    </button>
                </div>
            </div>

            <!-- Active Examination Arena (Hidden by default) -->
            <div id="exam-arena-card" class="ma-card" style="display: none; margin-bottom: 1.5rem;">
                <div class="ma-card__header" style="background: var(--bg-secondary);">
                    <div class="ma-flex" style="gap: 1rem; align-items: center;">
                        <span class="ma-badge ma-badge--danger" id="exam-live-indicator">● LIVE TEST</span>
                        <strong id="exam-active-title">Receiving Exam — 8 WPM</strong>
                    </div>
                    <div class="ma-flex" style="gap: 1rem; align-items: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; font-family: monospace; color: var(--accent-amber);" id="exam-countdown">
                            01:00
                        </div>
                        <button id="exam-abort-btn" class="ma-btn ma-btn--danger ma-btn--sm">
                            Finish Early
                        </button>
                    </div>
                </div>
                <div class="ma-card__body" style="padding: 2rem 1.5rem;">
                    <!-- Receiving Mode copy sheet -->
                    <div id="receiving-arena" style="display: block;">
                        <div class="ma-flex" style="justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <label class="ma-label" for="exam-copy-input" style="margin: 0;">Official Candidate Copy Sheet</label>
                            <span class="ma-text--muted" style="font-size: 0.8125rem;">Transcribe the Morse transmission continuously.</span>
                        </div>
                        <textarea id="exam-copy-input" class="ma-textarea" rows="5" placeholder="Copy text here as it is transmitted..." style="font-family: 'Courier New', Courier, monospace; font-size: 1.25rem; letter-spacing: 0.15em; text-transform: uppercase; resize: vertical;"></textarea>
                    </div>

                    <!-- Sending Mode keying station -->
                    <div id="sending-arena" style="display: none; text-align: center;">
                        <div class="ma-stat-label">EXAMINATION TRANSMISSION PROMPT</div>
                        <div id="exam-send-prompt" style="font-size: 1.75rem; font-weight: 700; font-family: monospace; letter-spacing: 0.15em; margin: 1rem 0; color: var(--accent-cyan);">
                            —
                        </div>
                        <div class="ma-telegraph-key" id="exam-telegraph-key" tabindex="0" role="button">
                            <span>TAP</span>
                            <small style="font-size: 0.75rem;">SPACE</small>
                        </div>
                        <div style="margin-top: 1rem;">
                            <div class="ma-label">Your Decoded Transmission:</div>
                            <div id="exam-send-decoded" style="min-height: 48px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 0.75rem; font-family: monospace; font-size: 1.25rem; letter-spacing: 0.15em;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Examination Grading & Results Report (Hidden by default) -->
            <div id="exam-results-card" class="ma-card" style="display: none; margin-bottom: 1.5rem;">
                <div class="ma-card__header">
                    <h3 class="ma-h3">Official Examination Results</h3>
                    <span id="exam-grade-badge" class="ma-badge ma-badge--success" style="font-size: 1rem; padding: 0.375rem 0.875rem;">
                        PASS
                    </span>
                </div>
                <div class="ma-card__body">
                    <div class="ma-grid ma-grid--4col" style="text-align: center; margin-bottom: 1.5rem;">
                        <div>
                            <div class="ma-stat-value" id="result-score-val">0%</div>
                            <div class="ma-stat-label">Final Accuracy</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="result-speed-val">8 WPM</div>
                            <div class="ma-stat-label">Tested Speed</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="result-chars-val">0 / 0</div>
                            <div class="ma-stat-label">Characters Correct</div>
                        </div>
                        <div>
                            <div class="ma-stat-value" id="result-outcome-val">PASS</div>
                            <div class="ma-stat-label">Result Status</div>
                        </div>
                    </div>

                    <!-- Mistake Analysis Comparison -->
                    <div style="background: var(--bg-secondary); border-radius: var(--border-radius-sm); padding: 1.25rem; margin-bottom: 1.5rem;">
                        <h4 class="ma-h4" style="margin-bottom: 0.75rem;">Transcript Discrepancy Analysis</h4>
                        <div style="margin-bottom: 0.75rem;">
                            <div class="ma-label">Official Target Transmission:</div>
                            <div id="report-expected-text" style="font-family: monospace; font-size: 1.125rem; color: var(--accent-cyan); word-break: break-all;"></div>
                        </div>
                        <div>
                            <div class="ma-label">Candidate Received Text:</div>
                            <div id="report-user-text" style="font-family: monospace; font-size: 1.125rem; word-break: break-all;"></div>
                        </div>
                    </div>
                </div>
                <div class="ma-card__footer" style="justify-content: space-between;">
                    <div id="report-certificate-note" class="ma-text--muted" style="font-size: 0.875rem;">
                        Performance recorded in candidate file.
                    </div>
                    <button id="exam-retake-btn" class="ma-btn ma-btn--primary">
                        🔄 Retake Examination
                    </button>
                </div>
            </div>

            <!-- Historical Examination Archive -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h3 class="ma-h3">Examination History</h3>
                </div>
                <div class="ma-card__body" style="padding: 0;">
                    <table class="ma-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Discipline</th>
                                <th>Speed</th>
                                <th>Accuracy</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="exam-history-tbody">
                            <tr>
                                <td colspan="5" class="ma-text--center ma-text--muted" style="padding: 1.5rem;">
                                    No examinations taken yet.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
    loadExamHistory();
}

function attachEventListeners() {
    if (!containerRef) return;

    // Quick 8 WPM Preset
    const quick8Btn = containerRef.querySelector('#btn-quick-8wpm');
    if (quick8Btn) {
        quick8Btn.addEventListener('click', () => {
            const wpmSelect = containerRef.querySelector('#exam-wpm-select');
            if (wpmSelect) wpmSelect.value = '8';
            if (window.Toast) window.Toast.info('8 WPM Standard Ham Radio Preset selected.');
        });
    }

    // Start Exam
    const startBtn = containerRef.querySelector('#exam-start-btn');
    if (startBtn) startBtn.addEventListener('click', startExam);

    // Abort Exam
    const abortBtn = containerRef.querySelector('#exam-abort-btn');
    if (abortBtn) abortBtn.addEventListener('click', finishExam);

    // Retake Exam
    const retakeBtn = containerRef.querySelector('#exam-retake-btn');
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            const setupCard = containerRef.querySelector('#exam-setup-card');
            const resultsCard = containerRef.querySelector('#exam-results-card');
            if (setupCard) setupCard.style.display = 'block';
            if (resultsCard) resultsCard.style.display = 'none';
        });
    }

    // Sending Key Handlers
    const keyBtn = containerRef.querySelector('#exam-telegraph-key');
    if (keyBtn) {
        keyBtn.addEventListener('mousedown', (e) => { e.preventDefault(); examKeyDown(); });
        keyBtn.addEventListener('mouseup', (e) => { e.preventDefault(); examKeyUp(); });
        keyBtn.addEventListener('mouseleave', (e) => { e.preventDefault(); examKeyUp(); });
        keyBtn.addEventListener('touchstart', (e) => { e.preventDefault(); examKeyDown(); }, { passive: false });
        keyBtn.addEventListener('touchend', (e) => { e.preventDefault(); examKeyUp(); }, { passive: false });
    }
}

function generateExamContent(type, count) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    if (type === 'five-char') {
        const groups = [];
        for (let g = 0; g < count; g++) {
            let grp = '';
            for (let i = 0; i < 5; i++) {
                grp += letters[Math.floor(Math.random() * letters.length)];
            }
            groups.push(grp);
        }
        return groups.join(' ');
    } else if (type === 'callsigns') {
        const selected = [];
        for (let i = 0; i < count; i++) {
            selected.push(MOCK_CALLSIGNS[Math.floor(Math.random() * MOCK_CALLSIGNS.length)]);
        }
        return selected.join(' ');
    } else if (type === 'numbers') {
        const groups = [];
        for (let g = 0; g < count; g++) {
            let grp = '';
            for (let i = 0; i < 5; i++) {
                grp += numbers[Math.floor(Math.random() * numbers.length)];
            }
            groups.push(grp);
        }
        return groups.join(' ');
    } else if (type === 'mixed') {
        const all = letters + numbers;
        const groups = [];
        for (let g = 0; g < count; g++) {
            let grp = '';
            for (let i = 0; i < 5; i++) {
                grp += all[Math.floor(Math.random() * all.length)];
            }
            groups.push(grp);
        }
        return groups.join(' ');
    } else {
        // Random characters
        const words = ['CQ', 'TEST', 'DE', 'RADIO', 'STATION', 'REPORT', 'SIGNAL', '73'];
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push(words[Math.floor(Math.random() * words.length)]);
        }
        return list.join(' ');
    }
}

function startExam() {
    if (!containerRef) return;

    examMode = containerRef.querySelector('#exam-mode-select').value;
    examWpm = parseInt(containerRef.querySelector('#exam-wpm-select').value, 10);
    examContentType = containerRef.querySelector('#exam-content-select').value;
    examDuration = parseInt(containerRef.querySelector('#exam-duration-select').value, 10);
    timeLeft = examDuration;
    examActive = true;

    // Generate examination text (approximate number of groups based on duration & WPM)
    const approximateWords = Math.max(6, Math.round((examWpm * examDuration) / 60));
    examContent = generateExamContent(examContentType, approximateWords);

    // Swap Cards
    containerRef.querySelector('#exam-setup-card').style.display = 'none';
    containerRef.querySelector('#exam-arena-card').style.display = 'block';
    containerRef.querySelector('#exam-results-card').style.display = 'none';

    containerRef.querySelector('#exam-active-title').textContent =
        `${examMode === 'receiving' ? 'Receiving Copy Exam' : 'Sending Key Exam'} — ${examWpm} WPM`;

    const rxArena = containerRef.querySelector('#receiving-arena');
    const txArena = containerRef.querySelector('#sending-arena');

    if (examMode === 'receiving') {
        rxArena.style.display = 'block';
        txArena.style.display = 'none';

        const copyInput = containerRef.querySelector('#exam-copy-input');
        if (copyInput) {
            copyInput.value = '';
            copyInput.disabled = false;
            copyInput.focus();
        }

        // Start transmitting audio sequence
        if (window.MorseAudio) {
            window.MorseAudio.init();
            window.MorseAudio.playSequence(examContent, {
                wpm: examWpm,
                farnsworthWpm: Math.min(examWpm, 12),
                frequency: 600,
                volume: 0.7,
                onComplete: () => {
                    // Transmission finished
                }
            });
        }
    } else {
        rxArena.style.display = 'none';
        txArena.style.display = 'block';
        containerRef.querySelector('#exam-send-prompt').textContent = examContent;
        containerRef.querySelector('#exam-send-decoded').textContent = '';
        sendingDecoded = '';
    }

    // Start Countdown Timer
    updateCountdownDisplay();
    examTimer = setInterval(() => {
        timeLeft--;
        updateCountdownDisplay();
        if (timeLeft <= 0) {
            finishExam();
        }
    }, 1000);
}

function updateCountdownDisplay() {
    if (!containerRef) return;
    const cdEl = containerRef.querySelector('#exam-countdown');
    if (!cdEl) return;

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    cdEl.textContent = `${mins}:${secs}`;
}

function finishExam() {
    if (!examActive) return;
    examActive = false;

    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }

    if (window.MorseAudio) {
        window.MorseAudio.stop();
    }

    // Evaluate Result
    evaluateExamResult();
}

function evaluateExamResult() {
    if (!containerRef) return;

    let candidateText = '';
    if (examMode === 'receiving') {
        const copyInput = containerRef.querySelector('#exam-copy-input');
        candidateText = copyInput ? copyInput.value.trim().toUpperCase() : '';
    } else {
        candidateText = sendingDecoded.trim().toUpperCase();
    }

    const expectedText = examContent.trim().toUpperCase();

    // Calculate score using character matching
    const expectedClean = expectedText.replace(/\s+/g, '');
    const candidateClean = candidateText.replace(/\s+/g, '');

    const maxLen = Math.max(expectedClean.length, candidateClean.length);
    let correctChars = 0;
    for (let i = 0; i < Math.min(expectedClean.length, candidateClean.length); i++) {
        if (expectedClean[i] === candidateClean[i]) {
            correctChars++;
        }
    }

    const accuracy = maxLen > 0 ? Math.round((correctChars / maxLen) * 100) : 0;
    const isPassed = accuracy >= 85;
    const isExcellent = accuracy >= 95;

    // Display Result Cards
    containerRef.querySelector('#exam-arena-card').style.display = 'none';
    const resultsCard = containerRef.querySelector('#exam-results-card');
    resultsCard.style.display = 'block';

    const gradeBadge = containerRef.querySelector('#exam-grade-badge');
    const scoreVal = containerRef.querySelector('#result-score-val');
    const speedVal = containerRef.querySelector('#result-speed-val');
    const charsVal = containerRef.querySelector('#result-chars-val');
    const outcomeVal = containerRef.querySelector('#result-outcome-val');
    const reportExpected = containerRef.querySelector('#report-expected-text');
    const reportUser = containerRef.querySelector('#report-user-text');

    if (scoreVal) scoreVal.textContent = `${accuracy}%`;
    if (speedVal) speedVal.textContent = `${examWpm} WPM`;
    if (charsVal) charsVal.textContent = `${correctChars} / ${maxLen}`;

    if (isExcellent) {
        gradeBadge.className = 'ma-badge ma-badge--success';
        gradeBadge.textContent = 'PASS WITH HONORS';
        outcomeVal.textContent = 'EXCELLENT';
        outcomeVal.style.color = 'var(--accent-amber)';
    } else if (isPassed) {
        gradeBadge.className = 'ma-badge ma-badge--success';
        gradeBadge.textContent = 'PASSED';
        outcomeVal.textContent = 'PASSED';
        outcomeVal.style.color = 'var(--accent-green)';
    } else {
        gradeBadge.className = 'ma-badge ma-badge--danger';
        gradeBadge.textContent = 'FAILED (REPEAT)';
        outcomeVal.textContent = 'FAILED';
        outcomeVal.style.color = 'var(--accent-red)';
    }

    if (reportExpected) reportExpected.textContent = expectedText;
    if (reportUser) reportUser.textContent = candidateText || '(No submission copied)';

    // Save exam in AppState history
    const record = {
        date: new Date().toLocaleDateString(),
        mode: examMode,
        wpm: examWpm,
        accuracy: accuracy,
        status: isPassed ? (isExcellent ? 'Excellent' : 'Passed') : 'Failed',
        created_at: new Date().toISOString()
    };

    saveExamToHistory(record);
}

function saveExamToHistory(record) {
    if (window.AppState) {
        const stats = window.AppState.getStats();
        const existingHistory = window.AppState.get('morseExamHistory', []);
        existingHistory.unshift(record);
        window.AppState.set('morseExamHistory', existingHistory.slice(0, 20));

        // Achievements check
        if (record.accuracy >= 85) {
            window.AppState.updateStats({
                history: [{ type: 'exam', wpm: record.wpm, accuracy: record.accuracy }]
            });
        }
    }

    if (window.MorseAPI) {
        window.MorseAPI.post('practice/session', {
            type: 'exam',
            wpm: record.wpm,
            accuracy: record.accuracy,
            duration: examDuration,
            details: record
        }).catch(() => {});
    }

    loadExamHistory();
}

function loadExamHistory() {
    if (!containerRef) return;
    const tbody = containerRef.querySelector('#exam-history-tbody');
    if (!tbody) return;

    const list = window.AppState ? window.AppState.get('morseExamHistory', []) : [];
    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="ma-text--center ma-text--muted" style="padding: 1.5rem;">
                    No examinations taken yet.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = list.map(item => `
        <tr>
            <td>${item.date}</td>
            <td style="text-transform: capitalize;">${item.mode}</td>
            <td><strong>${item.wpm} WPM</strong></td>
            <td>${item.accuracy}%</td>
            <td>
                <span class="ma-badge ${item.status.includes('Pass') || item.status.includes('Excellent') ? 'ma-badge--success' : 'ma-badge--danger'}">
                    ${item.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// Sending Key Operations
let keyPressStart = 0;
let keyBuffer = '';
let charTimer = null;

function examKeyDown() {
    if (!examActive || examMode !== 'sending') return;
    keyPressStart = performance.now();
    if (charTimer) clearTimeout(charTimer);

    if (window.MorseAudio) {
        window.MorseAudio.init();
    }
}

function examKeyUp() {
    if (!examActive || examMode !== 'sending' || keyPressStart === 0) return;
    const dur = performance.now() - keyPressStart;
    keyPressStart = 0;

    const nominalDot = 1200 / examWpm;
    const sym = dur < nominalDot * 2.0 ? '.' : '-';
    keyBuffer += sym;

    charTimer = setTimeout(() => {
        if (!keyBuffer) return;
        const char = window.MorseEngine ? window.MorseEngine.morseToChar(keyBuffer) : '?';
        sendingDecoded += (char || '?');
        keyBuffer = '';
        if (containerRef) {
            const el = containerRef.querySelector('#exam-send-decoded');
            if (el) el.textContent = sendingDecoded;
        }
    }, nominalDot * 3);
}

function handleKeyDown(e) {
    if (examActive && examMode === 'sending' && e.code === 'Space') {
        e.preventDefault();
        examKeyDown();
    }
}

function handleKeyUp(e) {
    if (examActive && examMode === 'sending' && e.code === 'Space') {
        e.preventDefault();
        examKeyUp();
    }
}

export function init() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

export function destroy() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }

    if (window.MorseAudio) {
        window.MorseAudio.stop();
    }

    examActive = false;
    containerRef = null;
}
