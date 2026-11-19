// Morse Academy — Morse Engine Module
// ITU International Standard Morse Code, Timing & Curriculum

const LETTERS = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
    'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
    'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
    'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
    'Z': '--..'
};

const NUMBERS = {
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

const PUNCTUATION = {
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.',  '(': '-.--.',  ')': '-.--.-', '&': '.-...',  ':': '---...',
    ';': '-.-.-.', '=': '-...-',  '+': '.-.-.',  '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

const PROSIGNS = {
    'AR': '.-.-.',     // End of message
    'SK': '...-.-',    // End of contact
    'BT': '-...-',     // Break/pause
    'KN': '-.--.',     // Invite named station only
    'SOS': '...---...', // Distress
    'HH': '........'   // Error / correction
};

// All mapped characters (Upper-cased)
const ALL_CHARS = {
    ...LETTERS,
    ...NUMBERS,
    ...PUNCTUATION
};

// Reverse map: morse -> char
const MORSE_TO_CHAR = {};
for (const [char, code] of Object.entries(ALL_CHARS)) {
    MORSE_TO_CHAR[code] = char;
}
for (const [prosign, code] of Object.entries(PROSIGNS)) {
    if (!MORSE_TO_CHAR[code]) {
        MORSE_TO_CHAR[code] = prosign;
    }
}

const CURRICULUM = [
    // STAGE 1 — LETTERS (Koch method order, 13 levels)
    { stage: 1, level: 1,  title: "First Steps",      chars: ["K", "M"],  desc: "Your journey begins" },
    { stage: 1, level: 2,  title: "Building Up",       chars: ["U", "R"],  desc: "Adding U and R" },
    { stage: 1, level: 3,  title: "Common Sounds",     chars: ["E", "S"],  desc: "The most common letters" },
    { stage: 1, level: 4,  title: "New Patterns",       chars: ["N", "A"],  desc: "Learning N and A" },
    { stage: 1, level: 5,  title: "Expanding",          chars: ["P", "T"],  desc: "Adding P and T" },
    { stage: 1, level: 6,  title: "Growing Strong",     chars: ["L", "W"],  desc: "L and W join the mix" },
    { stage: 1, level: 7,  title: "Short & Sharp",      chars: ["I", "J"],  desc: "Quick I and musical J" },
    { stage: 1, level: 8,  title: "Tricky Pairs",       chars: ["Z", "F"],  desc: "Stay sharp with Z and F" },
    { stage: 1, level: 9,  title: "Round Sounds",       chars: ["O", "Y"],  desc: "The long O and distinct Y" },
    { stage: 1, level: 10, title: "Getting There",      chars: ["V", "G"],  desc: "V and G" },
    { stage: 1, level: 11, title: "Almost Done",        chars: ["Q", "H"],  desc: "Q and the quick H" },
    { stage: 1, level: 12, title: "Final Letters I",    chars: ["B", "C"],  desc: "B and C" },
    { stage: 1, level: 13, title: "Last Two",           chars: ["D", "X"],  desc: "All letters learned!" },

    // STAGE 2 — NUMBERS (5 levels)
    { stage: 2, level: 14, title: "Numbers Begin",      chars: ["1", "2"],  desc: "Starting with 1 and 2" },
    { stage: 2, level: 15, title: "More Digits",        chars: ["3", "4"],  desc: "Adding 3 and 4" },
    { stage: 2, level: 16, title: "Middle Numbers",     chars: ["5", "6"],  desc: "The midpoint" },
    { stage: 2, level: 17, title: "Higher Up",          chars: ["7", "8"],  desc: "7 and 8" },
    { stage: 2, level: 18, title: "Complete Set",       chars: ["9", "0"],  desc: "All numbers mastered!" },

    // STAGE 3 — PUNCTUATION (5 levels)
    { stage: 3, level: 19, title: "Basic Punctuation",  chars: [".", ","],  desc: "Period and comma" },
    { stage: 3, level: 20, title: "Questions",          chars: ["?", "/"],  desc: "Question mark and slash" },
    { stage: 3, level: 21, title: "Operators",          chars: ["=", ":"],  desc: "Equals and colon" },
    { stage: 3, level: 22, title: "More Marks",         chars: [";", "'"],  desc: "Semicolon and apostrophe" },
    { stage: 3, level: 23, title: "Groups & Ranges",    chars: ["-", "(", ")"], desc: "Hyphen and parentheses" },

    // STAGE 4 — COMMON WORDS (3 levels)
    { stage: 4, level: 24, title: "Hello World",        words: ["HELLO", "WORLD", "MORSE", "CODE"], desc: "First words" },
    { stage: 4, level: 25, title: "Radio Words",        words: ["RADIO", "SIGNAL", "STATION", "ANTENNA"], desc: "Radio vocabulary" },
    { stage: 4, level: 26, title: "Operator Talk",      words: ["OPERATOR", "MESSAGE", "CONTACT", "REPORT"], desc: "Operator terms" },

    // STAGE 5 — SENTENCES (2 levels)
    { stage: 5, level: 27, title: "Simple Sentences",   desc: "Copy short sentences" },
    { stage: 5, level: 28, title: "Longer Messages",    desc: "Handle longer text" },

    // STAGE 6 — HAM RADIO (3 levels)
    { stage: 6, level: 29, title: "CQ Calls",           desc: "Learn to make CQ calls" },
    { stage: 6, level: 30, title: "Q-Codes",            desc: "Essential Q-codes" },
    { stage: 6, level: 31, title: "QSO Practice",       desc: "Complete radio conversations" },

    // STAGE 7 — SPEED TRAINING (1 level)
    { stage: 7, level: 32, title: "Speed Challenge",    desc: "Push your WPM higher" },
];

export const MorseEngine = {
    // --- Codec ---
    textToMorse(text) {
        if (!text) return '';
        return text
            .toUpperCase()
            .trim()
            .split(/\s+/)
            .map(word => {
                return word
                    .split('')
                    .map(char => ALL_CHARS[char] || char)
                    .join(' ');
            })
            .join(' / ');
    },

    morseToText(morse) {
        if (!morse) return '';
        return morse
            .trim()
            .split(/\s*\/\s*|\s{3,}/)
            .map(word => {
                return word
                    .trim()
                    .split(/\s+/)
                    .map(code => MORSE_TO_CHAR[code] || '?')
                    .join('');
            })
            .join(' ');
    },

    charToMorse(char) {
        if (!char) return '';
        const c = char.toUpperCase();
        return ALL_CHARS[c] || PROSIGNS[c] || '';
    },

    morseToChar(morse) {
        if (!morse) return '';
        return MORSE_TO_CHAR[morse.trim()] || '';
    },

    isValidMorse(str) {
        if (!str || typeof str !== 'string') return false;
        return /^[.\-\s\/]+$/.test(str.trim());
    },

    getAllChars() {
        return { ...ALL_CHARS };
    },

    getCharsByType(type) {
        switch (type) {
            case 'letters': return { ...LETTERS };
            case 'numbers': return { ...NUMBERS };
            case 'punctuation': return { ...PUNCTUATION };
            case 'prosigns': return { ...PROSIGNS };
            default: return { ...ALL_CHARS };
        }
    },

    // --- Timing (all in milliseconds) ---
    dotDuration(wpm = 15) {
        return 1200 / Math.max(1, wpm);
    },

    dashDuration(wpm = 15) {
        return 3 * this.dotDuration(wpm);
    },

    charSpace(wpm = 15) {
        return 1 * this.dotDuration(wpm);
    },

    letterSpace(wpm = 15, fwpm = null) {
        const dot = this.dotDuration(wpm);
        if (!fwpm || fwpm >= wpm) {
            return 3 * dot;
        }
        const totalDelay = (60000 / fwpm) - (31 * dot);
        return Math.max(3 * dot, (3 * totalDelay) / 19);
    },

    wordSpace(wpm = 15, fwpm = null) {
        const dot = this.dotDuration(wpm);
        if (!fwpm || fwpm >= wpm) {
            return 7 * dot;
        }
        const totalDelay = (60000 / fwpm) - (31 * dot);
        return Math.max(7 * dot, (7 * totalDelay) / 19);
    },

    // --- Curriculum ---
    getCurriculum() {
        return CURRICULUM;
    },

    getLevel(levelId) {
        const id = parseInt(levelId, 10);
        return CURRICULUM.find(l => l.level === id) || null;
    },

    getUnlockedChars(completedLevels = []) {
        const completedSet = new Set(completedLevels.map(Number));
        // Next unlocked level is the minimum level not in completedSet, or 1
        let maxUnlockedLevel = 1;
        while (completedSet.has(maxUnlockedLevel)) {
            maxUnlockedLevel++;
        }

        const chars = new Set();
        for (const item of CURRICULUM) {
            if (completedSet.has(item.level) || item.level <= maxUnlockedLevel) {
                if (item.chars) {
                    item.chars.forEach(c => chars.add(c));
                }
            }
        }
        return Array.from(chars);
    },

    generateExercise(levelId, type = 'identify', count = 10) {
        const level = this.getLevel(levelId) || CURRICULUM[0];
        let pool = [];

        if (level.chars && level.chars.length > 0) {
            // Collect chars up to this level for practice
            const charsUpToLevel = [];
            for (const item of CURRICULUM) {
                if (item.level <= level.level && item.chars) {
                    charsUpToLevel.push(...item.chars);
                }
            }
            pool = charsUpToLevel.length > 0 ? charsUpToLevel : level.chars;
        } else if (level.words && level.words.length > 0) {
            pool = level.words;
        } else {
            // Default pool
            pool = ['K', 'M', 'U', 'R', 'E', 'S'];
        }

        const exercises = [];
        const allLetters = Object.keys(LETTERS);

        for (let i = 0; i < count; i++) {
            // Pick an item from pool, with higher weight to current level chars
            let target;
            if (level.chars && level.chars.length > 0 && Math.random() < 0.6) {
                target = level.chars[Math.floor(Math.random() * level.chars.length)];
            } else {
                target = pool[Math.floor(Math.random() * pool.length)];
            }

            const morse = this.textToMorse(target);
            const ex = { char: target, morse };

            if (type === 'identify') {
                // Generate 4 choices
                const choices = new Set([target]);
                while (choices.size < Math.min(4, pool.length >= 4 ? pool.length : allLetters.length)) {
                    const candidate = (pool.length >= 4)
                        ? pool[Math.floor(Math.random() * pool.length)]
                        : allLetters[Math.floor(Math.random() * allLetters.length)];
                    choices.add(candidate);
                }
                ex.choices = Array.from(choices).sort(() => Math.random() - 0.5);
            }

            exercises.push(ex);
        }

        return exercises;
    }
};

if (typeof window !== 'undefined') {
    window.MorseEngine = MorseEngine;
}
