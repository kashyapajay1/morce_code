// Morse Academy — Reference Page
// International Morse Code tables, Phonetics, Prosigns, Q-Codes, and Ham Radio Abbreviations

let containerRef = null;
let activeTab = 'letters'; // 'letters', 'numbers', 'punctuation', 'prosigns', 'qcodes', 'abbreviations'
let searchQuery = '';

// Phonetic alphabet names for NATO standard
const PHONETICS = {
    'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
    'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
    'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
    'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
    'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee', 'Z': 'Zulu'
};

const NUMBER_NAMES = {
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
    '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

const PUNCTUATION_NAMES = {
    '.': 'Period / Full Stop',
    ',': 'Comma',
    '?': 'Question Mark',
    "'": 'Apostrophe',
    '!': 'Exclamation Mark',
    '/': 'Slash / Fraction Bar',
    '(': 'Open Parenthesis',
    ')': 'Close Parenthesis',
    '&': 'Ampersand',
    ':': 'Colon',
    ';': 'Semicolon',
    '=': 'Double Dash / Equal',
    '+': 'Plus',
    '-': 'Hyphen / Minus',
    '_': 'Underscore',
    '"': 'Quotation Mark',
    '$': 'Dollar Sign',
    '@': 'At Sign'
};

const PROSIGNS_DATA = [
    { code: 'AR', morse: '.-.-.', meaning: 'End of message (over)' },
    { code: 'SK', morse: '...-.-', meaning: 'End of contact / final sign-off' },
    { code: 'BT', morse: '-...-', meaning: 'Break / pause / new paragraph' },
    { code: 'KN', morse: '-.--.', meaning: 'Go ahead, named station only' },
    { code: 'SOS', morse: '...---...', meaning: 'International Distress Signal' },
    { code: 'HH', morse: '........', meaning: 'Error / correction follows' },
    { code: 'AS', morse: '.-...', meaning: 'Wait / stand by' },
    { code: 'KA', morse: '-.-.-', meaning: 'Attention / start of transmission' }
];

const Q_CODES_DATA = [
    { code: 'QTH', morse: '--.- - ....', meaning: 'My location is… / What is your location?' },
    { code: 'QSL', morse: '--.- ... .-..', meaning: 'I acknowledge receipt / Can you acknowledge receipt?' },
    { code: 'QRM', morse: '--.- .-. --', meaning: 'I am being interfered with / Man-made noise' },
    { code: 'QRN', morse: '--.- .-. -.', meaning: 'I am troubled by static / Atmospheric noise' },
    { code: 'QRZ', morse: '--.- .-. --..', meaning: 'Who is calling me?' },
    { code: 'QSO', morse: '--.- ... ---', meaning: 'I can communicate with… / Two-way contact' },
    { code: 'QSY', morse: '--.- ... -.--', meaning: 'Change frequency to…' },
    { code: 'QRV', morse: '--.- .-. ...-', meaning: 'I am ready' },
    { code: 'QRT', morse: '--.- .-. -', meaning: 'Stop transmitting / Closing station' },
    { code: 'QRS', morse: '--.- .-. ...', meaning: 'Send more slowly' },
    { code: 'QRQ', morse: '--.- .-. --.-', meaning: 'Send more quickly' },
    { code: 'QSB', morse: '--.- ... -...', meaning: 'Your signal is fading' },
    { code: 'QRP', morse: '--.- .-. .--.', meaning: 'Reduce power / Operating low power (<5W)' },
    { code: 'QRO', morse: '--.- .-. ---', meaning: 'Increase power / High power' },
    { code: 'QRX', morse: '--.- .-. -..-', meaning: 'Stand by / Wait' },
    { code: 'QRG', morse: '--.- .-. --.', meaning: 'Your exact frequency is…' }
];

const ABBREVIATIONS_DATA = [
    { abbr: 'CQ', morse: '-.-. --.-', meaning: 'Calling any station (General call)' },
    { abbr: 'DE', morse: '-.. .', meaning: 'From / this is (preceding callsign)' },
    { abbr: '73', morse: '--... ...--', meaning: 'Best regards' },
    { abbr: '88', morse: '---.. ---..', meaning: 'Love and kisses' },
    { abbr: 'OM', morse: '--- --', meaning: 'Old man (fellow male operator)' },
    { abbr: 'YL', morse: '-.-- .-..', meaning: 'Young lady (female operator)' },
    { abbr: 'XYL', morse: '-..- -.-- .-..', meaning: 'Ex-young lady (wife)' },
    { abbr: 'FB', morse: '..-. -...', meaning: 'Fine business (excellent / good job)' },
    { abbr: 'HI', morse: '.... ..', meaning: 'Laughter in Morse code' },
    { abbr: 'R', morse: '.-.', meaning: 'Received / Roger / understood' },
    { abbr: 'K', morse: '-.-', meaning: 'Over / go ahead (any station)' },
    { abbr: 'BK', morse: '-... -.-', meaning: 'Break / back to you immediately' },
    { abbr: 'GM', morse: '--. --', meaning: 'Good morning' },
    { abbr: 'GA', morse: '--. .-', meaning: 'Good afternoon' },
    { abbr: 'GE', morse: '--. .', meaning: 'Good evening' },
    { abbr: 'GN', morse: '--. -.', meaning: 'Good night' },
    { abbr: 'WX', morse: '.-- -..-', meaning: 'Weather' },
    { abbr: 'UR', morse: '..- .-.', meaning: 'Your / you are' },
    { abbr: 'RPRT', morse: '.-. .--. .-. -', meaning: 'Report (signal report)' },
    { abbr: 'CFM', morse: '-.-. ..-. --', meaning: 'Confirm' },
    { abbr: 'ES', morse: '. ...', meaning: 'And (&)' },
    { abbr: 'TU', morse: '- ..-', meaning: 'Thank you' },
    { abbr: 'TNX', morse: '- -. -..-', meaning: 'Thanks' },
    { abbr: 'HW', morse: '.... .--', meaning: 'How (how copy?)' },
    { abbr: 'FER', morse: '..-. . .-.', meaning: 'For' },
    { abbr: 'BCN', morse: '-... -.-. -.', meaning: 'Beacon' },
    { abbr: 'ANT', morse: '.- -. -', meaning: 'Antenna' },
    { abbr: 'TX', morse: '- -..-', meaning: 'Transmitter / transmit' },
    { abbr: 'RX', morse: '.-. -..-', meaning: 'Receiver / receive' },
    { abbr: 'RIG', morse: '.-. .. --.', meaning: 'Radio equipment / station' }
];

function renderReferenceHTML() {
    return `
    <div class="ma-page ma-fade-in">
        <header class="ma-page__header" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem;">
            <div>
                <h1 class="ma-h1">Morse Code Reference</h1>
                <p class="ma-text ma-text--muted">Comprehensive International Telecommunication Union (ITU) chart, phonetic naming, Q-codes, and radio terms.</p>
            </div>
            
            <!-- Global Tab Search Input -->
            <div style="min-width: 260px;">
                <input type="search" id="ref-search-input" class="ma-input" placeholder="🔍 Search characters, codes, meanings..." value="${searchQuery}" style="border-radius: 50px; padding: 0.5rem 1rem;">
            </div>
        </header>

        <!-- Navigation Tabs -->
        <div class="ma-tabs" style="margin-bottom: 2rem; overflow-x: auto; white-space: nowrap;">
            <button class="ma-tab ${activeTab === 'letters' ? 'ma-tab--active' : ''}" data-tab="letters">
                Letters (A–Z)
            </button>
            <button class="ma-tab ${activeTab === 'numbers' ? 'ma-tab--active' : ''}" data-tab="numbers">
                Numbers (0–9)
            </button>
            <button class="ma-tab ${activeTab === 'punctuation' ? 'ma-tab--active' : ''}" data-tab="punctuation">
                Punctuation
            </button>
            <button class="ma-tab ${activeTab === 'prosigns' ? 'ma-tab--active' : ''}" data-tab="prosigns">
                Prosigns
            </button>
            <button class="ma-tab ${activeTab === 'qcodes' ? 'ma-tab--active' : ''}" data-tab="qcodes">
                Q-Codes
            </button>
            <button class="ma-tab ${activeTab === 'abbreviations' ? 'ma-tab--active' : ''}" data-tab="abbreviations">
                Abbreviations
            </button>
        </div>

        <!-- Tab Content Container -->
        <div id="ref-content-area">
            ${renderActiveTabContent()}
        </div>
    </div>
    `;
}

function renderVisualDotsDashes(morse) {
    if (!morse) return '';
    return morse.split('').map(sym => {
        if (sym === '.') {
            return '<span class="ma-dot" style="display:inline-block; width:10px; height:10px; border-radius:50%; background:var(--accent-cyan);"></span>';
        } else if (sym === '-' || sym === '—') {
            return '<span class="ma-dash" style="display:inline-block; width:22px; height:10px; border-radius:3px; background:var(--accent-cyan);"></span>';
        } else if (sym === ' ') {
            return '<span style="width: 10px; display:inline-block;"></span>';
        }
        return '';
    }).join('');
}

function renderActiveTabContent() {
    const q = searchQuery.toLowerCase().trim();
    const engine = window.MorseEngine;

    if (activeTab === 'letters') {
        const lettersObj = engine ? engine.getCharsByType('letters') : {};
        const entries = Object.entries(lettersObj).filter(([char, code]) => {
            const phonetic = (PHONETICS[char] || '').toLowerCase();
            return !q || char.toLowerCase().includes(q) || code.includes(q) || phonetic.includes(q);
        });

        if (entries.length === 0) return renderEmptySearch();

        return `
        <div class="ma-grid ma-grid--4col" style="gap: 1.25rem;">
            ${entries.map(([char, code]) => `
                <div class="ma-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-size: 2.25rem; font-weight: 800; color: var(--accent-cyan); line-height: 1;">${char}</span>
                            <div class="ma-text--muted" style="font-size: 0.85rem; font-weight: 500;">${PHONETICS[char] || ''}</div>
                        </div>
                        <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-btn" data-char="${char}" title="Play audio">
                            <span>🔊</span>
                        </button>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 0.6rem 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                        <div class="ma-morse-display" style="display: flex; align-items: center; gap: 4px;">
                            ${renderVisualDotsDashes(code)}
                        </div>
                        <span style="font-family: monospace; font-size: 1.15rem; font-weight: 700; letter-spacing: 2px;">${code}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    }

    if (activeTab === 'numbers') {
        const numbersObj = engine ? engine.getCharsByType('numbers') : {};
        const entries = Object.entries(numbersObj).filter(([char, code]) => {
            const name = (NUMBER_NAMES[char] || '').toLowerCase();
            return !q || char.toLowerCase().includes(q) || code.includes(q) || name.includes(q);
        });

        if (entries.length === 0) return renderEmptySearch();

        return `
        <div class="ma-grid ma-grid--4col" style="gap: 1.25rem;">
            ${entries.map(([char, code]) => `
                <div class="ma-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-size: 2.25rem; font-weight: 800; color: var(--accent-amber); line-height: 1;">${char}</span>
                            <div class="ma-text--muted" style="font-size: 0.85rem; font-weight: 500;">${NUMBER_NAMES[char] || ''}</div>
                        </div>
                        <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-btn" data-char="${char}" title="Play audio">
                            <span>🔊</span>
                        </button>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 0.6rem 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                        <div class="ma-morse-display" style="display: flex; align-items: center; gap: 4px;">
                            ${renderVisualDotsDashes(code)}
                        </div>
                        <span style="font-family: monospace; font-size: 1.15rem; font-weight: 700; letter-spacing: 2px;">${code}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    }

    if (activeTab === 'punctuation') {
        const punctObj = engine ? engine.getCharsByType('punctuation') : {};
        const entries = Object.entries(punctObj).filter(([char, code]) => {
            const name = (PUNCTUATION_NAMES[char] || '').toLowerCase();
            return !q || char.toLowerCase().includes(q) || code.includes(q) || name.includes(q);
        });

        if (entries.length === 0) return renderEmptySearch();

        return `
        <div class="ma-grid ma-grid--3col" style="gap: 1.25rem;">
            ${entries.map(([char, code]) => `
                <div class="ma-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-size: 2.25rem; font-weight: 800; color: var(--accent-green); line-height: 1;">${char}</span>
                            <div class="ma-text--muted" style="font-size: 0.85rem; font-weight: 500;">${PUNCTUATION_NAMES[char] || 'Special Symbol'}</div>
                        </div>
                        <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-btn" data-char="${char}" title="Play audio">
                            <span>🔊</span>
                        </button>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 0.6rem 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                        <div class="ma-morse-display" style="display: flex; align-items: center; gap: 4px;">
                            ${renderVisualDotsDashes(code)}
                        </div>
                        <span style="font-family: monospace; font-size: 1.15rem; font-weight: 700; letter-spacing: 2px;">${code}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    }

    if (activeTab === 'prosigns') {
        const list = PROSIGNS_DATA.filter(item => {
            return !q || item.code.toLowerCase().includes(q) || item.morse.includes(q) || item.meaning.toLowerCase().includes(q);
        });

        if (list.length === 0) return renderEmptySearch();

        return `
        <div class="ma-grid ma-grid--2col" style="gap: 1.25rem;">
            ${list.map(item => `
                <div class="ma-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.75rem; font-weight: 800; color: var(--accent-cyan); font-family: monospace;">[${item.code}]</span>
                                <span class="ma-badge ma-badge--info">Prosign</span>
                            </div>
                            <div class="ma-text" style="font-size: 0.95rem; margin-top: 0.25rem;">${item.meaning}</div>
                        </div>
                        <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-morse-btn" data-morse="${item.morse}" title="Play audio">
                            <span>🔊</span>
                        </button>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 0.6rem 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                        <div class="ma-morse-display" style="display: flex; align-items: center; gap: 4px;">
                            ${renderVisualDotsDashes(item.morse)}
                        </div>
                        <span style="font-family: monospace; font-size: 1.2rem; font-weight: 700; letter-spacing: 2px;">${item.morse}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    }

    if (activeTab === 'qcodes') {
        const list = Q_CODES_DATA.filter(item => {
            return !q || item.code.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q) || item.morse.includes(q);
        });

        if (list.length === 0) return renderEmptySearch();

        return `
        <div class="ma-card">
            <div class="ma-card__body" style="padding: 0; overflow-x: auto;">
                <table class="ma-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="width: 110px;">Q-Code</th>
                            <th style="width: 180px;">Morse Representation</th>
                            <th>Operational Meaning</th>
                            <th style="width: 80px; text-align: center;">Audio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(item => `
                            <tr>
                                <td>
                                    <strong style="color: var(--accent-amber); font-size: 1.1rem; font-family: monospace;">${item.code}</strong>
                                </td>
                                <td>
                                    <span style="font-family: monospace; font-size: 1rem; letter-spacing: 2px; color: var(--text-secondary);">${item.morse}</span>
                                </td>
                                <td style="font-size: 0.95rem;">${item.meaning}</td>
                                <td style="text-align: center;">
                                    <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-seq-btn" data-text="${item.code}" title="Listen to ${item.code}">
                                        <span>🔊</span>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    if (activeTab === 'abbreviations') {
        const list = ABBREVIATIONS_DATA.filter(item => {
            return !q || item.abbr.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q) || item.morse.includes(q);
        });

        if (list.length === 0) return renderEmptySearch();

        return `
        <div class="ma-card">
            <div class="ma-card__body" style="padding: 0; overflow-x: auto;">
                <table class="ma-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="width: 110px;">Abbreviation</th>
                            <th style="width: 180px;">Morse Code</th>
                            <th>Meaning</th>
                            <th style="width: 80px; text-align: center;">Audio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map(item => `
                            <tr>
                                <td>
                                    <strong style="color: var(--accent-cyan); font-size: 1.1rem; font-family: monospace;">${item.abbr}</strong>
                                </td>
                                <td>
                                    <span style="font-family: monospace; font-size: 1rem; letter-spacing: 2px; color: var(--text-secondary);">${item.morse}</span>
                                </td>
                                <td style="font-size: 0.95rem;">${item.meaning}</td>
                                <td style="text-align: center;">
                                    <button class="ma-btn ma-btn--ghost ma-btn--sm ref-play-seq-btn" data-text="${item.abbr}" title="Listen to ${item.abbr}">
                                        <span>🔊</span>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    return '';
}

function renderEmptySearch() {
    return `
    <div class="ma-empty-state" style="padding: 3rem 1rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
        <h3 class="ma-h3">No matching results found</h3>
        <p class="ma-text ma-text--muted" style="margin-top: 0.25rem;">Try adjusting your search query or switch to another reference tab.</p>
    </div>
    `;
}

function bindReferenceEvents() {
    if (!containerRef) return;

    // Tab buttons
    const tabs = containerRef.querySelectorAll('.ma-tabs .ma-tab[data-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const t = tab.getAttribute('data-tab');
            if (t !== activeTab) {
                activeTab = t;
                render(containerRef);
            }
        });
    });

    // Search input
    const searchInput = containerRef.querySelector('#ref-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            const contentArea = containerRef.querySelector('#ref-content-area');
            if (contentArea) {
                contentArea.innerHTML = renderActiveTabContent();
                bindAudioButtons();
            }
        });
    }

    bindAudioButtons();
}

function bindAudioButtons() {
    if (!containerRef) return;

    // Single character audio
    const charPlayBtns = containerRef.querySelectorAll('.ref-play-btn');
    charPlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.MorseAudio) {
                window.MorseAudio.init();
                const ch = btn.getAttribute('data-char');
                window.MorseAudio.playChar(ch);
            }
        });
    });

    // Morse string audio (for prosigns)
    const morsePlayBtns = containerRef.querySelectorAll('.ref-play-morse-btn');
    morsePlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.MorseAudio) {
                window.MorseAudio.init();
                const morse = btn.getAttribute('data-morse');
                window.MorseAudio.playMorse(morse);
            }
        });
    });

    // Sequence audio (for Q-Codes and abbreviations)
    const seqPlayBtns = containerRef.querySelectorAll('.ref-play-seq-btn');
    seqPlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.MorseAudio) {
                window.MorseAudio.init();
                const text = btn.getAttribute('data-text');
                window.MorseAudio.playSequence(text);
            }
        });
    });
}

export function render(container) {
    containerRef = container;
    container.innerHTML = renderReferenceHTML();
    bindReferenceEvents();
}

export function init() {
    if (window.MorseAudio) {
        try { window.MorseAudio.init(); } catch {}
    }
}

export function destroy() {
    if (window.MorseAudio) {
        try { window.MorseAudio.stop(); } catch {}
    }
    containerRef = null;
}
