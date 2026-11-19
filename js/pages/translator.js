// Morse Academy — Translator Page
// Real-time bidirectional Text ↔ Morse Code conversion, audio playback, and speed tuning

let containerRef = null;
let mode = 'textToMorse'; // 'textToMorse' or 'morseToText'
let debounceTimer = null;
let isAudioPlaying = false;

function getSettings() {
    return window.AppState ? window.AppState.getSettings() : { wpm: 15, frequency: 600, volume: 0.7 };
}

function renderTranslatorHTML() {
    const settings = getSettings();
    const wpm = settings.wpm || 15;
    const freq = settings.frequency || 600;

    return `
    <div class="ma-page ma-fade-in">
        <header class="ma-page__header">
            <h1 class="ma-h1">Morse Code Translator</h1>
            <p class="ma-text ma-text--muted">Convert text to International Morse Code and decode Morse back into plain text with real-time audio playback.</p>
        </header>

        <!-- Direction & Mode Switcher Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button id="trans-btn-mode-toggle" class="ma-btn ma-btn--secondary">
                    <span id="trans-mode-icon">🔄</span>
                    <span id="trans-mode-label">${mode === 'textToMorse' ? 'Mode: Text → Morse' : 'Mode: Morse → Text'}</span>
                </button>
                <span id="trans-mode-hint" class="ma-text--muted" style="font-size: 0.9rem;">
                    ${mode === 'textToMorse' ? 'Type English letters or numbers on the left.' : 'Type dots (.) and dashes (-) on the left.'}
                </span>
            </div>

            <div style="display: flex; gap: 0.5rem;">
                <button id="trans-btn-clear" class="ma-btn ma-btn--ghost ma-btn--sm" title="Clear All Text">
                    <span>🗑️ Clear</span>
                </button>
                <button id="trans-btn-copy" class="ma-btn ma-btn--ghost ma-btn--sm" title="Copy Translation">
                    <span>📋 Copy Output</span>
                </button>
            </div>
        </div>

        <!-- Two-Panel Translation Grid -->
        <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 1.5rem;">
            <!-- Input Panel -->
            <div class="ma-card">
                <div class="ma-card__header" style="justify-content: space-between; padding: 1rem 1.25rem;">
                    <label for="trans-input" class="ma-h4" style="margin: 0; color: var(--accent-cyan);">
                        ${mode === 'textToMorse' ? 'Plain Text (Input)' : 'Morse Code (Input: . - /)'}
                    </label>
                    <span id="trans-input-count" class="ma-text--muted" style="font-size: 0.85rem;">0 characters</span>
                </div>
                <div class="ma-card__body" style="padding: 1rem;">
                    <textarea id="trans-input" class="ma-textarea" rows="7" placeholder="${mode === 'textToMorse' ? 'Type or paste plain text here...' : 'Type morse code: dots (.), dashes (-), spaces between letters, / between words...'}" style="width: 100%; resize: vertical; font-family: ${mode === 'morseToText' ? 'monospace' : 'inherit'}; font-size: 1.1rem; letter-spacing: ${mode === 'morseToText' ? '2px' : 'normal'}; line-height: 1.6;"></textarea>
                    
                    ${mode === 'morseToText' ? `
                        <!-- Quick Morse Touch Keypad -->
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                            <button id="trans-key-dot" class="ma-btn ma-btn--ghost" style="flex: 1; font-weight: 800; font-size: 1.5rem; padding: 0.4rem;">• (Dot)</button>
                            <button id="trans-key-dash" class="ma-btn ma-btn--ghost" style="flex: 1; font-weight: 800; font-size: 1.5rem; padding: 0.4rem;">— (Dash)</button>
                            <button id="trans-key-space" class="ma-btn ma-btn--ghost" style="flex: 1; font-weight: 600; font-size: 0.9rem; padding: 0.4rem;">Letter Space</button>
                            <button id="trans-key-word" class="ma-btn ma-btn--ghost" style="flex: 1; font-weight: 600; font-size: 0.9rem; padding: 0.4rem;">/ Word Space</button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Output Panel -->
            <div class="ma-card">
                <div class="ma-card__header" style="justify-content: space-between; padding: 1rem 1.25rem;">
                    <label for="trans-output" class="ma-h4" style="margin: 0; color: var(--accent-amber);">
                        ${mode === 'textToMorse' ? 'Morse Code (Output)' : 'Plain Text (Output)'}
                    </label>
                    <span id="trans-output-count" class="ma-text--muted" style="font-size: 0.85rem;">0 elements</span>
                </div>
                <div class="ma-card__body" style="padding: 1rem;">
                    <textarea id="trans-output" class="ma-textarea" rows="7" readonly placeholder="Translation appears automatically here..." style="width: 100%; resize: vertical; font-family: ${mode === 'textToMorse' ? 'monospace' : 'inherit'}; font-size: 1.15rem; letter-spacing: ${mode === 'textToMorse' ? '3px' : 'normal'}; line-height: 1.6; background: var(--bg-secondary);"></textarea>
                    <div id="trans-warning-banner" style="margin-top: 0.5rem; font-size: 0.85rem; display: none;"></div>
                </div>
            </div>
        </div>

        <!-- Playback & Tuning Controls Card -->
        <div class="ma-card">
            <div class="ma-card__header">
                <h3 class="ma-h4">Audio Transmission Controls</h3>
            </div>
            <div class="ma-card__body">
                <div class="ma-grid ma-grid--3col" style="gap: 1.5rem; align-items: center;">
                    <!-- Play / Stop Buttons -->
                    <div style="display: flex; gap: 0.75rem;">
                        <button id="trans-btn-play" class="ma-btn ma-btn--primary ma-btn--lg" style="flex: 1;">
                            <span id="trans-play-icon">▶</span>
                            <span id="trans-play-label">Play Audio</span>
                        </button>
                        <button id="trans-btn-stop" class="ma-btn ma-btn--danger ma-btn--lg" disabled>
                            <span>⏹ Stop</span>
                        </button>
                    </div>

                    <!-- Speed Slider (WPM) -->
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                            <label class="ma-label" for="trans-slider-wpm" style="margin: 0;">Transmission Speed</label>
                            <span id="trans-wpm-val" style="font-weight: 700; color: var(--accent-cyan);">${wpm} WPM</span>
                        </div>
                        <input type="range" id="trans-slider-wpm" class="ma-range" min="5" max="35" value="${wpm}" style="width: 100%;">
                    </div>

                    <!-- Audio Pitch / Frequency Slider -->
                    <div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                            <label class="ma-label" for="trans-slider-freq" style="margin: 0;">Audio Frequency</label>
                            <span id="trans-freq-val" style="font-weight: 700; color: var(--accent-amber);">${freq} Hz</span>
                        </div>
                        <input type="range" id="trans-slider-freq" class="ma-range" min="400" max="1000" step="25" value="${freq}" style="width: 100%;">
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

function handleTranslation() {
    if (!containerRef) return;
    const inputEl = containerRef.querySelector('#trans-input');
    const outputEl = containerRef.querySelector('#trans-output');
    const warningEl = containerRef.querySelector('#trans-warning-banner');
    const inputCountEl = containerRef.querySelector('#trans-input-count');
    const outputCountEl = containerRef.querySelector('#trans-output-count');
    const engine = window.MorseEngine;

    if (!inputEl || !outputEl) return;
    const val = inputEl.value;

    if (inputCountEl) {
        inputCountEl.textContent = `${val.length} characters`;
    }

    if (!val.trim()) {
        outputEl.value = '';
        if (outputCountEl) outputCountEl.textContent = '0 elements';
        if (warningEl) warningEl.style.display = 'none';
        return;
    }

    if (mode === 'textToMorse') {
        const translated = engine ? engine.textToMorse(val) : '';
        outputEl.value = translated;

        // Check for untranslated characters
        const unsupported = [];
        const allChars = engine ? engine.getAllChars() : {};
        for (const ch of val.toUpperCase()) {
            if (ch !== ' ' && ch !== '\n' && !allChars[ch]) {
                if (!unsupported.includes(ch)) unsupported.push(ch);
            }
        }

        if (warningEl) {
            if (unsupported.length > 0) {
                warningEl.style.display = 'block';
                warningEl.innerHTML = `<span class="ma-badge ma-badge--warning">Note: Unsupported characters kept as literals: ${unsupported.join(' ')}</span>`;
            } else {
                warningEl.style.display = 'none';
            }
        }

        if (outputCountEl) {
            const elements = (translated.match(/[.-]/g) || []).length;
            outputCountEl.textContent = `${elements} dots & dashes`;
        }
    } else {
        const translated = engine ? engine.morseToText(val) : '';
        outputEl.value = translated;

        if (warningEl) {
            if (translated.includes('?')) {
                warningEl.style.display = 'block';
                warningEl.innerHTML = `<span class="ma-badge ma-badge--warning">Note: Some morse tokens could not be recognized (marked with ?)</span>`;
            } else {
                warningEl.style.display = 'none';
            }
        }

        if (outputCountEl) {
            outputCountEl.textContent = `${translated.length} characters decoded`;
        }
    }
}

function stopAudio() {
    isAudioPlaying = false;
    if (window.MorseAudio) {
        window.MorseAudio.stop();
    }
    updateAudioButtonsState();
}

function updateAudioButtonsState() {
    if (!containerRef) return;
    const playBtn = containerRef.querySelector('#trans-btn-play');
    const stopBtn = containerRef.querySelector('#trans-btn-stop');
    const playLabel = containerRef.querySelector('#trans-play-label');

    if (playBtn && stopBtn) {
        if (isAudioPlaying) {
            playBtn.disabled = true;
            stopBtn.disabled = false;
            if (playLabel) playLabel.textContent = 'Transmitting...';
        } else {
            playBtn.disabled = false;
            stopBtn.disabled = true;
            if (playLabel) playLabel.textContent = 'Play Audio';
        }
    }
}

function playTranslationAudio() {
    if (!containerRef || !window.MorseAudio) return;
    window.MorseAudio.init();

    const outputEl = containerRef.querySelector('#trans-output');
    const inputEl = containerRef.querySelector('#trans-input');
    const wpmSlider = containerRef.querySelector('#trans-slider-wpm');
    const freqSlider = containerRef.querySelector('#trans-slider-freq');

    const morseCode = mode === 'textToMorse' ? outputEl?.value : inputEl?.value;
    if (!morseCode || !morseCode.trim()) {
        if (window.Toast) window.Toast.info('Please enter text or Morse code first.');
        return;
    }

    const wpm = wpmSlider ? parseInt(wpmSlider.value, 10) : 15;
    const freq = freqSlider ? parseInt(freqSlider.value, 10) : 600;

    isAudioPlaying = true;
    updateAudioButtonsState();

    window.MorseAudio.playMorse(morseCode, {
        wpm,
        frequency: freq,
        onComplete: () => {
            isAudioPlaying = false;
            updateAudioButtonsState();
        }
    });
}

function bindTranslatorEvents() {
    if (!containerRef) return;

    const inputEl = containerRef.querySelector('#trans-input');
    if (inputEl) {
        inputEl.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(handleTranslation, 200);
        });
    }

    // Mode Toggle
    const modeBtn = containerRef.querySelector('#trans-btn-mode-toggle');
    if (modeBtn) {
        modeBtn.addEventListener('click', () => {
            stopAudio();
            mode = (mode === 'textToMorse') ? 'morseToText' : 'textToMorse';
            render(containerRef);
        });
    }

    // Clear Button
    const clearBtn = containerRef.querySelector('#trans-btn-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            stopAudio();
            if (inputEl) inputEl.value = '';
            handleTranslation();
        });
    }

    // Copy Output Button
    const copyBtn = containerRef.querySelector('#trans-btn-copy');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const outputEl = containerRef.querySelector('#trans-output');
            if (outputEl && outputEl.value) {
                navigator.clipboard.writeText(outputEl.value).then(() => {
                    if (window.Toast) window.Toast.success('Copied to clipboard!');
                }).catch(() => {
                    outputEl.select();
                    document.execCommand('copy');
                    if (window.Toast) window.Toast.success('Copied to clipboard!');
                });
            }
        });
    }

    // Audio Play / Stop
    const playBtn = containerRef.querySelector('#trans-btn-play');
    if (playBtn) playBtn.addEventListener('click', playTranslationAudio);

    const stopBtn = containerRef.querySelector('#trans-btn-stop');
    if (stopBtn) stopBtn.addEventListener('click', stopAudio);

    // Speed Slider
    const wpmSlider = containerRef.querySelector('#trans-slider-wpm');
    const wpmVal = containerRef.querySelector('#trans-wpm-val');
    if (wpmSlider && wpmVal) {
        wpmSlider.addEventListener('input', () => {
            wpmVal.textContent = `${wpmSlider.value} WPM`;
        });
    }

    // Frequency Slider
    const freqSlider = containerRef.querySelector('#trans-slider-freq');
    const freqVal = containerRef.querySelector('#trans-freq-val');
    if (freqSlider && freqVal) {
        freqSlider.addEventListener('input', () => {
            freqVal.textContent = `${freqSlider.value} Hz`;
            if (window.MorseAudio) {
                window.MorseAudio.setFrequency(parseInt(freqSlider.value, 10));
            }
        });
    }

    // Morse keypad buttons (for morseToText mode)
    const keyDot = containerRef.querySelector('#trans-key-dot');
    if (keyDot) {
        keyDot.addEventListener('click', () => {
            if (inputEl) {
                inputEl.value += '.';
                handleTranslation();
            }
        });
    }

    const keyDash = containerRef.querySelector('#trans-key-dash');
    if (keyDash) {
        keyDash.addEventListener('click', () => {
            if (inputEl) {
                inputEl.value += '-';
                handleTranslation();
            }
        });
    }

    const keySpace = containerRef.querySelector('#trans-key-space');
    if (keySpace) {
        keySpace.addEventListener('click', () => {
            if (inputEl) {
                inputEl.value += ' ';
                handleTranslation();
            }
        });
    }

    const keyWord = containerRef.querySelector('#trans-key-word');
    if (keyWord) {
        keyWord.addEventListener('click', () => {
            if (inputEl) {
                inputEl.value += ' / ';
                handleTranslation();
            }
        });
    }
}

export function render(container) {
    containerRef = container;
    container.innerHTML = renderTranslatorHTML();
    bindTranslatorEvents();
}

export function init() {
    if (window.MorseAudio) {
        try { window.MorseAudio.init(); } catch {}
    }
}

export function destroy() {
    stopAudio();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    containerRef = null;
}
