// Morse Academy — Academy Page
// Progressive Morse Code Curriculum, Level Map, Interactive Lessons, Audio Quizzes & Level Exams

let containerRef = null;
let currentView = 'map'; // 'map' or 'detail'
let selectedLevelId = 1;
let activeTab = 'intro'; // 'intro', 'listening', 'typing', 'exam'
let activeStage = 'all'; // 'all' or 1..7

// Active session states
let timers = [];
let intervals = [];

// Listening quiz state (Tab B)
let listenState = {
    round: 0,
    totalRounds: 10,
    score: 0,
    currentQuestion: null,
    answered: false,
    history: []
};

// Typing quiz state (Tab C)
let typeState = {
    round: 0,
    totalRounds: 5,
    score: 0,
    currentSequence: '',
    answered: false,
    history: []
};

// Exam state (Tab D)
let examState = {
    active: false,
    questions: [],
    currentIndex: 0,
    score: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    completed: false,
    answers: []
};

function clearAllTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
    intervals.forEach(i => clearInterval(i));
    intervals = [];
    if (examState.timerInterval) {
        clearInterval(examState.timerInterval);
        examState.timerInterval = null;
    }
    if (window.MorseAudio) {
        try { window.MorseAudio.stop(); } catch {}
    }
}

function safeAudioInit() {
    if (window.MorseAudio) {
        try { window.MorseAudio.init(); } catch {}
    }
}

// Rhythm description helper (e.g. . - . -> "di-DAH-dit")
function getRhythmDescription(morseCode) {
    if (!morseCode) return '';
    const parts = morseCode.split('');
    const rhythm = parts.map((p, idx) => {
        if (p === '.') {
            return (idx === parts.length - 1) ? 'dit' : 'di';
        } else if (p === '-' || p === '—') {
            return 'DAH';
        }
        return '';
    }).filter(Boolean).join('-');
    return rhythm;
}

// Check level status
function getLevelStatus(levelId, progress, passingThreshold = 70) {
    const completedLevels = progress.completedLevels || [];
    const scores = progress.scores || {};
    const score = scores[levelId] || 0;

    const isCompleted = completedLevels.includes(levelId);
    if (isCompleted) {
        if (score >= 95) return { status: 'excellent', label: '⭐ Excellent', badge: 'ma-badge--warning', score };
        return { status: 'completed', label: '🟢 Completed', badge: 'ma-badge--success', score };
    }

    // Check if unlocked
    if (levelId === 1) {
        return { status: 'current', label: '🔵 Current', badge: 'ma-badge--info', score };
    }

    const prevLevelCompleted = completedLevels.includes(levelId - 1);
    if (prevLevelCompleted || (progress.currentLevel === levelId)) {
        return { status: 'current', label: '🔵 Current', badge: 'ma-badge--info', score };
    }

    return { status: 'locked', label: '🔒 Locked', badge: 'ma-badge--danger', score };
}

// RENDER LEVEL MAP VIEW
function renderLevelMapHTML(curriculum, progress, settings) {
    const passingThreshold = settings.passingThreshold || 70;
    const stages = [
        { id: 'all', name: 'All Stages' },
        { id: 1, name: 'Stage 1: Letters' },
        { id: 2, name: 'Stage 2: Numbers' },
        { id: 3, name: 'Stage 3: Punctuation' },
        { id: 4, name: 'Stage 4: Words' },
        { id: 5, name: 'Stage 5: Sentences' },
        { id: 6, name: 'Stage 6: Ham Radio' },
        { id: 7, name: 'Stage 7: Speed' }
    ];

    const filteredCurriculum = activeStage === 'all'
        ? curriculum
        : curriculum.filter(l => l.stage === Number(activeStage));

    return `
    <div class="ma-page ma-fade-in">
        <header class="ma-page__header" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem;">
            <div>
                <h1 class="ma-h1">Morse Academy</h1>
                <p class="ma-text ma-text--muted">Progressive Koch-method learning. Master symbols one rhythm at a time.</p>
            </div>
            <div style="background: var(--bg-card); padding: 0.75rem 1.25rem; border-radius: var(--border-radius); border: 1px solid var(--border-color); text-align: right;">
                <div class="ma-text--muted" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Your Progress</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-cyan);">
                    ${(progress.completedLevels || []).length} / ${curriculum.length} Levels
                </div>
            </div>
        </header>

        <!-- Stage Filter Tabs -->
        <div class="ma-tabs" style="margin-bottom: 2rem; overflow-x: auto; white-space: nowrap; padding-bottom: 4px;">
            ${stages.map(st => `
                <button class="ma-tab ${activeStage.toString() === st.id.toString() ? 'ma-tab--active' : ''}" data-stage="${st.id}">
                    ${st.name}
                </button>
            `).join('')}
        </div>

        <!-- Levels Grid -->
        <div class="ma-grid ma-grid--3col" style="gap: 1.25rem;">
            ${filteredCurriculum.map(item => {
                const statusInfo = getLevelStatus(item.level, progress, passingThreshold);
                const isLocked = statusInfo.status === 'locked';
                const cardClass = `ma-card ma-level-card ma-level-card--${statusInfo.status}`;
                const engine = window.MorseEngine;

                return `
                <div class="${cardClass}" data-level-id="${item.level}" style="cursor: ${isLocked ? 'not-allowed' : 'pointer'}; opacity: ${isLocked ? '0.65' : '1'}; transition: transform 0.2s, box-shadow 0.2s;">
                    <div class="ma-card__header" style="padding: 1rem 1.25rem;">
                        <div>
                            <span class="ma-badge ${statusInfo.badge}">${statusInfo.label}</span>
                            <h3 class="ma-h4" style="margin-top: 0.4rem;">Level ${item.level}: ${item.title}</h3>
                        </div>
                        ${statusInfo.score > 0 ? `
                            <span style="font-size: 0.85rem; font-weight: 600; color: var(--accent-amber);">
                                ${statusInfo.score}%
                            </span>
                        ` : ''}
                    </div>

                    <div class="ma-card__body" style="padding: 1rem 1.25rem;">
                        <p class="ma-text ma-text--muted" style="font-size: 0.9rem; margin-bottom: 1rem;">${item.desc}</p>
                        
                        ${item.chars && item.chars.length > 0 ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${item.chars.map(c => `
                                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.3rem 0.6rem; border-radius: var(--border-radius-sm); font-size: 0.9rem;">
                                        <strong style="color: var(--accent-cyan);">${c}</strong>
                                        <span style="font-family: monospace; margin-left: 0.25rem; letter-spacing: 1px; color: var(--text-secondary);">${engine ? engine.charToMorse(c) : ''}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : (item.words ? `
                            <div class="ma-text--muted" style="font-size: 0.85rem;">Words: ${item.words.slice(0, 4).join(', ')}</div>
                        ` : '')}
                    </div>

                    <div class="ma-card__footer" style="padding: 0.75rem 1.25rem; justify-content: space-between;">
                        <span class="ma-text--muted" style="font-size: 0.8rem;">Stage ${item.stage}</span>
                        <button class="ma-btn ma-btn--sm ${isLocked ? 'ma-btn--ghost' : (statusInfo.status === 'current' ? 'ma-btn--primary' : 'ma-btn--secondary')}" ${isLocked ? 'disabled' : ''}>
                            ${isLocked ? 'Locked' : (statusInfo.status === 'current' ? 'Continue' : 'Review')}
                        </button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </div>
    `;
}

// RENDER LEVEL DETAIL VIEW
function renderLevelDetailHTML(level, progress, settings) {
    const engine = window.MorseEngine;
    const completedLevels = progress.completedLevels || [];
    const statusInfo = getLevelStatus(level.level, progress, settings.passingThreshold || 70);
    const unlockedChars = engine ? engine.getUnlockedChars(completedLevels) : [];

    return `
    <div class="ma-page ma-fade-in">
        <!-- Breadcrumb / Back button -->
        <div style="margin-bottom: 1.25rem;">
            <button id="academy-btn-back" class="ma-btn ma-btn--ghost ma-btn--sm" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                <span>←</span>
                <span>Back to Curriculum Map</span>
            </button>
        </div>

        <!-- Level Header Card -->
        <div class="ma-card" style="margin-bottom: 1.5rem;">
            <div class="ma-card__header" style="flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                        <span class="ma-badge ${statusInfo.badge}">${statusInfo.label}</span>
                        <span class="ma-badge ma-badge--info">Stage ${level.stage}</span>
                    </div>
                    <h1 class="ma-h2">Level ${level.level}: ${level.title}</h1>
                    <p class="ma-text ma-text--muted" style="margin-top: 0.25rem;">${level.desc}</p>
                </div>

                ${statusInfo.score > 0 ? `
                    <div style="text-align: right;">
                        <div class="ma-text--muted" style="font-size: 0.8rem; text-transform: uppercase;">Best Exam Score</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--accent-amber);">${statusInfo.score}%</div>
                    </div>
                ` : ''}
            </div>

            <!-- Detail Tabs Bar -->
            <div class="ma-tabs" style="padding: 0 1.5rem; border-top: 1px solid var(--border-color); background: var(--bg-secondary);">
                <button class="ma-tab ${activeTab === 'intro' ? 'ma-tab--active' : ''}" data-tab="intro">
                    📖 Introduction
                </button>
                <button class="ma-tab ${activeTab === 'listening' ? 'ma-tab--active' : ''}" data-tab="listening">
                    🎧 Listening Quiz
                </button>
                <button class="ma-tab ${activeTab === 'typing' ? 'ma-tab--active' : ''}" data-tab="typing">
                    ⌨️ Listen & Type
                </button>
                <button class="ma-tab ${activeTab === 'exam' ? 'ma-tab--active' : ''}" data-tab="exam">
                    📝 Level Exam
                </button>
            </div>
        </div>

        <!-- Tab Body Content -->
        <div id="academy-tab-content">
            ${renderTabContent(level, unlockedChars, settings)}
        </div>
    </div>
    `;
}

// RENDER INDIVIDUAL TAB CONTENT
function renderTabContent(level, unlockedChars, settings) {
    if (activeTab === 'intro') {
        return renderIntroTab(level, unlockedChars);
    } else if (activeTab === 'listening') {
        return renderListeningTab(level, unlockedChars);
    } else if (activeTab === 'typing') {
        return renderTypingTab(level, unlockedChars);
    } else if (activeTab === 'exam') {
        return renderExamTab(level, unlockedChars, settings);
    }
    return '';
}

// -------------------------------------------------------------
// TAB A: INTRODUCTION
// -------------------------------------------------------------
function renderIntroTab(level, unlockedChars) {
    const engine = window.MorseEngine;
    const targetChars = level.chars || (level.words ? level.words : []);

    return `
    <div class="ma-fade-in" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- New Characters in this Level -->
        <div class="ma-card">
            <div class="ma-card__header" style="justify-content: space-between;">
                <div>
                    <h2 class="ma-h3">Target Characters for Level ${level.level}</h2>
                    <p class="ma-text ma-text--muted">Listen to the rhythm. Do not count dots and dashes; hear the melody!</p>
                </div>
                ${targetChars.length > 1 ? `
                    <button id="intro-btn-play-all" class="ma-btn ma-btn--primary">
                        <span>▶ Play All Characters</span>
                    </button>
                ` : ''}
            </div>

            <div class="ma-card__body">
                <div class="ma-grid ma-grid--2col" style="gap: 1.25rem;">
                    ${targetChars.map(c => {
                        const morse = engine ? (engine.charToMorse(c) || engine.textToMorse(c)) : '';
                        const rhythm = getRhythmDescription(morse);
                        return `
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <span style="font-size: 2.75rem; font-weight: 800; color: var(--accent-cyan); line-height: 1;">${c}</span>
                                    <div class="ma-text--muted" style="margin-top: 0.35rem; font-weight: 500;">Rhythm: <span style="color: var(--text-primary); font-family: monospace;">"${rhythm}"</span></div>
                                </div>
                                <button class="ma-btn ma-btn--secondary intro-char-play" data-char="${c}">
                                    <span>🔊 Play</span>
                                </button>
                            </div>

                            <!-- Morse dots and dashes display -->
                            <div style="background: var(--bg-card); padding: 0.75rem 1rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
                                <div class="ma-morse-display" style="display: flex; align-items: center; gap: 6px;">
                                    ${morse.split('').map(sym => {
                                        if (sym === '.') return '<span class="ma-dot" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--accent-cyan);"></span>';
                                        if (sym === '-' || sym === '—') return '<span class="ma-dash" style="display:inline-block; width:28px; height:12px; border-radius:4px; background:var(--accent-cyan);"></span>';
                                        return '<span style="width: 12px;"></span>';
                                    }).join('')}
                                </div>
                                <span style="font-family: monospace; font-size: 1.25rem; font-weight: 700; letter-spacing: 2px; color: var(--text-primary);">${morse}</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- Cumulative Characters Learned So Far -->
        <div class="ma-card">
            <div class="ma-card__header">
                <h3 class="ma-h4">Cumulative Character Pool (${unlockedChars.length} characters learned)</h3>
            </div>
            <div class="ma-card__body">
                ${unlockedChars.length === 0 ? `
                    <p class="ma-text ma-text--muted">This is your first step! Complete this level to begin building your pool.</p>
                ` : `
                    <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
                        ${unlockedChars.map(c => `
                            <button class="ma-btn ma-btn--ghost ma-btn--sm intro-char-play" data-char="${c}" style="border: 1px solid var(--border-color); padding: 0.35rem 0.65rem;">
                                <strong style="color: var(--accent-cyan); margin-right: 0.25rem;">${c}</strong>
                                <span style="font-family: monospace; color: var(--text-secondary);">${engine ? engine.charToMorse(c) : ''}</span>
                                <span style="margin-left: 0.35rem; font-size: 0.75rem;">🔊</span>
                            </button>
                        `).join('')}
                    </div>
                `}
            </div>
            <div class="ma-card__footer" style="justify-content: flex-end;">
                <button id="intro-btn-next-tab" class="ma-btn ma-btn--primary">
                    <span>Proceed to Listening Quiz →</span>
                </button>
            </div>
        </div>
    </div>
    `;
}

// -------------------------------------------------------------
// TAB B: LISTENING IDENTIFICATION QUIZ
// -------------------------------------------------------------
function renderListeningTab(level, unlockedChars) {
    if (listenState.round >= listenState.totalRounds) {
        // Quiz completed screen
        const pct = Math.round((listenState.score / listenState.totalRounds) * 100);
        return `
        <div class="ma-card ma-fade-in" style="max-width: 650px; margin: 0 auto; text-align: center;">
            <div class="ma-card__body" style="padding: 3rem 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 1rem;">
                    ${pct >= 80 ? '🎉' : '🎧'}
                </div>
                <h2 class="ma-h2">Listening Quiz Complete!</h2>
                <div style="font-size: 3rem; font-weight: 800; color: ${pct >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'}; margin: 1rem 0;">
                    ${listenState.score} / ${listenState.totalRounds}
                    <span style="font-size: 1.5rem; font-weight: 500; display: block; color: var(--text-secondary);">${pct}% Accuracy</span>
                </div>
                <p class="ma-text ma-text--muted" style="margin-bottom: 2rem;">
                    ${pct >= 80 ? 'Outstanding ear! You are quickly recognizing symbols by audio melody.' : 'Good effort! Morse requires auditory repetition. Try again to lock in the sounds.'}
                </p>

                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <button id="listening-btn-retry" class="ma-btn ma-btn--secondary">
                        <span>🔄 Retry Quiz</span>
                    </button>
                    <button id="listening-btn-to-typing" class="ma-btn ma-btn--primary">
                        <span>Go to Listen & Type →</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    // Active listening question
    const q = listenState.currentQuestion;
    const progressPct = Math.round((listenState.round / listenState.totalRounds) * 100);

    return `
    <div class="ma-card ma-fade-in" style="max-width: 680px; margin: 0 auto;">
        <div class="ma-card__header" style="justify-content: space-between;">
            <div>
                <span class="ma-badge ma-badge--info">Question ${listenState.round + 1} of ${listenState.totalRounds}</span>
            </div>
            <div style="font-weight: 600; color: var(--accent-cyan);">
                Score: ${listenState.score} / ${listenState.round}
            </div>
        </div>

        <div class="ma-card__body" style="padding: 2rem;">
            <div class="ma-progress" style="margin-bottom: 2rem;">
                <div class="ma-progress__bar ma-progress__bar--cyan" style="width: ${progressPct}%;"></div>
            </div>

            <!-- Central Audio Action Button -->
            <div style="text-align: center; margin-bottom: 2.5rem;">
                <button id="listening-btn-play" class="ma-btn ma-btn--primary ma-btn--lg" style="border-radius: 50px; padding: 1rem 2.5rem; font-size: 1.2rem; box-shadow: 0 0 25px rgba(34, 211, 238, 0.4);">
                    <span id="listening-play-icon">🔊</span>
                    <span id="listening-play-text">Play Audio</span>
                </button>
                <div class="ma-text--muted" style="font-size: 0.85rem; margin-top: 0.75rem;">
                    Click to hear the sound, then choose which character it was.
                </div>
            </div>

            <!-- Multiple Choice Buttons Grid -->
            <div class="ma-grid ma-grid--2col" style="gap: 1rem;">
                ${q ? q.choices.map(choice => `
                    <button class="ma-btn ma-btn--ghost listening-choice-btn" data-choice="${choice}" style="font-size: 1.75rem; font-weight: 700; height: 75px; border: 2px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--border-radius); transition: all 0.15s;" ${listenState.answered ? 'disabled' : ''}>
                        ${choice}
                    </button>
                `).join('') : ''}
            </div>

            <!-- Feedback Message Banner -->
            <div id="listening-feedback" style="min-height: 48px; margin-top: 1.5rem; text-align: center; display: flex; align-items: center; justify-content: center;"></div>
        </div>

        <div class="ma-card__footer" style="justify-content: space-between;">
            <button id="listening-btn-replay-footer" class="ma-btn ma-btn--ghost ma-btn--sm">
                <span>🔄 Replay Tone</span>
            </button>
            ${listenState.answered ? `
                <button id="listening-btn-next" class="ma-btn ma-btn--primary ma-btn--sm">
                    <span>Next Question →</span>
                </button>
            ` : '<span class="ma-text--muted" style="font-size: 0.85rem;">Select an option above</span>'}
        </div>
    </div>
    `;
}

// -------------------------------------------------------------
// TAB C: LISTENING & TYPING QUIZ
// -------------------------------------------------------------
function renderTypingTab(level, unlockedChars) {
    if (typeState.round >= typeState.totalRounds) {
        const pct = Math.round((typeState.score / typeState.totalRounds) * 100);
        return `
        <div class="ma-card ma-fade-in" style="max-width: 650px; margin: 0 auto; text-align: center;">
            <div class="ma-card__body" style="padding: 3rem 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 1rem;">
                    ${pct >= 80 ? '🏆' : '⌨️'}
                </div>
                <h2 class="ma-h2">Typing Practice Complete!</h2>
                <div style="font-size: 3rem; font-weight: 800; color: ${pct >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'}; margin: 1rem 0;">
                    ${typeState.score} / ${typeState.totalRounds}
                    <span style="font-size: 1.5rem; font-weight: 500; display: block; color: var(--text-secondary);">${pct}% Accuracy</span>
                </div>
                <p class="ma-text ma-text--muted" style="margin-bottom: 2rem;">
                    ${pct >= 80 ? 'Excellent transcription! You are ready to tackle the official Level Exam.' : 'Transcription takes practice. Keep your fingers ready on the keyboard!'}
                </p>

                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                    <button id="typing-btn-retry" class="ma-btn ma-btn--secondary">
                        <span>🔄 Retry Typing</span>
                    </button>
                    <button id="typing-btn-to-exam" class="ma-btn ma-btn--primary">
                        <span>Take Level Exam →</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    const progressPct = Math.round((typeState.round / typeState.totalRounds) * 100);

    return `
    <div class="ma-card ma-fade-in" style="max-width: 680px; margin: 0 auto;">
        <div class="ma-card__header" style="justify-content: space-between;">
            <div>
                <span class="ma-badge ma-badge--info">Round ${typeState.round + 1} of ${typeState.totalRounds}</span>
            </div>
            <div style="font-weight: 600; color: var(--accent-cyan);">
                Score: ${typeState.score} / ${typeState.round}
            </div>
        </div>

        <div class="ma-card__body" style="padding: 2rem;">
            <div class="ma-progress" style="margin-bottom: 2rem;">
                <div class="ma-progress__bar ma-progress__bar--cyan" style="width: ${progressPct}%;"></div>
            </div>

            <!-- Central Audio Action Button -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <button id="typing-btn-play" class="ma-btn ma-btn--primary ma-btn--lg" style="border-radius: 50px; padding: 1rem 2.5rem; font-size: 1.2rem; box-shadow: 0 0 25px rgba(34, 211, 238, 0.4);">
                    <span id="typing-play-icon">🔊</span>
                    <span id="typing-play-text">Play Sequence (${typeState.currentSequence.length} characters)</span>
                </button>
                <div class="ma-text--muted" style="font-size: 0.85rem; margin-top: 0.75rem;">
                    Listen carefully. Visual morse is hidden to train pure ear-to-keyboard transcription.
                </div>
            </div>

            <!-- Typing Input Area -->
            <div style="margin-bottom: 1.5rem;">
                <label class="ma-label" for="typing-input" style="font-size: 1rem; text-align: center; margin-bottom: 0.75rem;">
                    Type what you heard:
                </label>
                <input type="text" id="typing-input" class="ma-input" placeholder="TYPE CHARACTERS HERE" maxlength="10" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="text-align: center; font-size: 2rem; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; height: 65px; border: 2px solid var(--border-color);" ${typeState.answered ? 'disabled' : ''}>
            </div>

            <!-- Feedback comparison area -->
            <div id="typing-feedback" style="min-height: 60px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;"></div>
        </div>

        <div class="ma-card__footer" style="justify-content: space-between;">
            <button id="typing-btn-replay-footer" class="ma-btn ma-btn--ghost ma-btn--sm">
                <span>🔄 Replay Sequence</span>
            </button>
            <div style="display: flex; gap: 0.75rem;">
                ${!typeState.answered ? `
                    <button id="typing-btn-submit" class="ma-btn ma-btn--primary">
                        <span>Submit Answer</span>
                    </button>
                ` : `
                    <button id="typing-btn-next" class="ma-btn ma-btn--primary">
                        <span>Next Round →</span>
                    </button>
                `}
            </div>
        </div>
    </div>
    `;
}

// -------------------------------------------------------------
// TAB D: LEVEL EXAM (THE OFFICIAL UNLOCK EXAM)
// -------------------------------------------------------------
function renderExamTab(level, unlockedChars, settings) {
    if (!examState.active && !examState.completed) {
        // Pre-exam instruction screen
        return `
        <div class="ma-card ma-fade-in" style="max-width: 700px; margin: 0 auto;">
            <div class="ma-card__header">
                <div>
                    <span class="ma-badge ma-badge--warning">Official Qualification</span>
                    <h2 class="ma-h3" style="margin-top: 0.25rem;">Level ${level.level} Exam: ${level.title}</h2>
                </div>
            </div>

            <div class="ma-card__body" style="padding: 2rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">📝</div>
                    <h3 class="ma-h3">Ready to Unlock the Next Level?</h3>
                    <p class="ma-text ma-text--muted" style="max-width: 500px; margin: 0.5rem auto 0;">
                        This official 20-question exam tests your real-time recognition and transcription speed.
                    </p>
                </div>

                <div style="background: var(--bg-secondary); border-radius: var(--border-radius); border: 1px solid var(--border-color); padding: 1.25rem; margin-bottom: 2rem;">
                    <h4 class="ma-h4" style="margin-bottom: 0.75rem;">Exam Rules & Passing Standards:</h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.95rem;">
                        <li style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📊</span>
                            <span><strong>20 Questions:</strong> Mix of Multiple Choice Identification & Transcription.</span>
                        </li>
                        <li style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>⏱️</span>
                            <span><strong>Timed Session:</strong> Elapsed time is tracked and scored.</span>
                        </li>
                        <li style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>🎯</span>
                            <span><strong>Score Requirements:</strong></span>
                        </li>
                        <li style="padding-left: 2rem; font-size: 0.9rem; color: var(--text-secondary);">
                            • <strong style="color: var(--accent-red);">Below 70%:</strong> Fail — Must retry.<br>
                            • <strong style="color: var(--accent-amber);">70% - 84%:</strong> Passed! Review recommended.<br>
                            • <strong style="color: var(--accent-green);">85% - 94%:</strong> Great Job! Next level unlocked.<br>
                            • <strong style="color: var(--accent-cyan);">95% - 100%:</strong> Excellent! Mastery badge awarded.
                        </li>
                    </ul>
                </div>

                <div style="text-align: center;">
                    <button id="exam-btn-start" class="ma-btn ma-btn--primary ma-btn--lg" style="padding: 1rem 3rem; font-size: 1.15rem;">
                        <span>🚀 Begin Level Exam</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    if (examState.completed) {
        // Exam Result Screen
        const total = examState.questions.length || 20;
        const scorePct = Math.round((examState.score / total) * 100);
        const passed = scorePct >= 70;
        const isExcellent = scorePct >= 95;
        const stars = scorePct >= 95 ? 3 : (scorePct >= 85 ? 2 : (scorePct >= 70 ? 1 : 0));

        const mins = Math.floor(examState.elapsedSeconds / 60);
        const secs = examState.elapsedSeconds % 60;
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        return `
        <div class="ma-card ma-fade-in" style="max-width: 750px; margin: 0 auto; text-align: center;">
            <div class="ma-card__body" style="padding: 3rem 2rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                    ${passed ? (isExcellent ? '🌟' : '🎉') : '💔'}
                </div>

                <div style="font-size: 2.5rem; letter-spacing: 4px; margin-bottom: 0.5rem; color: var(--accent-amber);">
                    ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}
                </div>

                <h2 class="ma-h2">${passed ? (isExcellent ? 'Mastery Achieved!' : 'Exam Passed!') : 'Keep Practicing!'}</h2>
                
                <div style="font-size: 4rem; font-weight: 800; color: ${passed ? (isExcellent ? 'var(--accent-cyan)' : 'var(--accent-green)') : 'var(--accent-red)'}; margin: 0.5rem 0 1rem;">
                    ${scorePct}%
                    <div style="font-size: 1.1rem; font-weight: 500; color: var(--text-secondary);">
                        ${examState.score} of ${total} correct in ${timeStr}
                    </div>
                </div>

                <div style="max-width: 500px; margin: 0 auto 2rem;">
                    <p class="ma-text">
                        ${scorePct < 70 ? 'You did not meet the 70% passing threshold for this level. Review the sounds and give it another try!' : (scorePct < 85 ? 'You passed! You may proceed to the next level, but reviewing current sounds is encouraged.' : (scorePct < 95 ? 'Great performance! You have comfortably cleared this level and unlocked the next challenge.' : 'Outstanding performance! Flawless rhythm and ear-training accuracy.'))}
                    </p>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 2.5rem;">
                    <button id="exam-btn-retry" class="ma-btn ma-btn--secondary">
                        <span>🔄 Retry Exam</span>
                    </button>
                    ${passed ? `
                        <button id="exam-btn-next-level" class="ma-btn ma-btn--primary">
                            <span>Next Level (${level.level + 1}) →</span>
                        </button>
                    ` : `
                        <button id="exam-btn-review-lesson" class="ma-btn ma-btn--ghost">
                            <span>📖 Review Introduction</span>
                        </button>
                    `}
                </div>

                <!-- Detailed Breakdown Accordion -->
                <div style="text-align: left; background: var(--bg-secondary); border-radius: var(--border-radius); border: 1px solid var(--border-color); padding: 1.5rem;">
                    <h3 class="ma-h4" style="margin-bottom: 1rem;">Question Breakdown:</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 250px; overflow-y: auto;">
                        ${examState.answers.map((ans, idx) => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-card); border-radius: var(--border-radius-sm); border-left: 4px solid ${ans.isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                <span style="font-size: 0.9rem;">
                                    <strong>#${idx + 1} (${ans.type})</strong>: Target: <code style="color:var(--accent-cyan); font-weight:bold;">${ans.target}</code> | Your answer: <code style="color:${ans.isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'};">${ans.userAnswer || '(none)'}</code>
                                </span>
                                <span class="ma-badge ${ans.isCorrect ? 'ma-badge--success' : 'ma-badge--danger'}" style="font-size: 0.75rem;">
                                    ${ans.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    // Active exam in progress
    const currentQ = examState.questions[examState.currentIndex];
    const progressPct = Math.round(((examState.currentIndex) / examState.questions.length) * 100);
    const mins = Math.floor(examState.elapsedSeconds / 60);
    const secs = examState.elapsedSeconds % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return `
    <div class="ma-card ma-fade-in" style="max-width: 680px; margin: 0 auto;">
        <div class="ma-card__header" style="justify-content: space-between;">
            <div>
                <span class="ma-badge ma-badge--warning">Question ${examState.currentIndex + 1} of ${examState.questions.length}</span>
                <span class="ma-badge ma-badge--info" style="margin-left: 0.5rem;">${currentQ.type === 'mc' ? 'Multiple Choice' : 'Transcription'}</span>
            </div>
            <div style="font-family: monospace; font-size: 1.15rem; font-weight: 700; color: var(--accent-amber);">
                ⏱️ ${timeStr}
            </div>
        </div>

        <div class="ma-card__body" style="padding: 2rem;">
            <div class="ma-progress" style="margin-bottom: 2rem;">
                <div class="ma-progress__bar ma-progress__bar--amber" style="width: ${progressPct}%;"></div>
            </div>

            <!-- Central Audio Trigger -->
            <div style="text-align: center; margin-bottom: 2rem;">
                <button id="exam-btn-play" class="ma-btn ma-btn--primary ma-btn--lg" style="border-radius: 50px; padding: 1rem 2.5rem; font-size: 1.2rem; box-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">
                    <span id="exam-play-icon">🔊</span>
                    <span id="exam-play-text">Play Audio Prompt</span>
                </button>
                <div class="ma-text--muted" style="font-size: 0.85rem; margin-top: 0.75rem;">
                    Listen carefully. Answer will submit automatically once selected.
                </div>
            </div>

            ${currentQ.type === 'mc' ? `
                <!-- Multiple Choice Question -->
                <div class="ma-grid ma-grid--2col" style="gap: 1rem;">
                    ${currentQ.choices.map(choice => `
                        <button class="ma-btn ma-btn--ghost exam-mc-btn" data-choice="${choice}" style="font-size: 1.75rem; font-weight: 700; height: 75px; border: 2px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--border-radius);">
                            ${choice}
                        </button>
                    `).join('')}
                </div>
            ` : `
                <!-- Typing Question -->
                <div>
                    <label class="ma-label" for="exam-typing-input" style="font-size: 1rem; text-align: center; margin-bottom: 0.75rem;">
                        Type the character or sequence you heard:
                    </label>
                    <input type="text" id="exam-typing-input" class="ma-input" placeholder="TYPE HERE" maxlength="6" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="text-align: center; font-size: 2rem; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; height: 65px; border: 2px solid var(--border-color);">
                    <div style="text-align: center; margin-top: 1rem;">
                        <button id="exam-btn-submit-typing" class="ma-btn ma-btn--primary">
                            <span>Submit Answer ↵</span>
                        </button>
                    </div>
                </div>
            `}

            <div id="exam-feedback-flash" style="min-height: 40px; margin-top: 1.5rem; text-align: center;"></div>
        </div>

        <div class="ma-card__footer" style="justify-content: space-between;">
            <button id="exam-btn-replay-footer" class="ma-btn ma-btn--ghost ma-btn--sm">
                <span>🔄 Replay Tone</span>
            </button>
            <span class="ma-text--muted" style="font-size: 0.85rem;">Score: ${examState.score}</span>
        </div>
    </div>
    `;
}

// -------------------------------------------------------------
// EVENT BINDINGS & LOGIC CONTROLLERS
// -------------------------------------------------------------
function bindAcademyEvents() {
    if (!containerRef) return;

    if (currentView === 'map') {
        // Stage filter buttons
        const stageTabs = containerRef.querySelectorAll('.ma-tab[data-stage]');
        stageTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                activeStage = tab.getAttribute('data-stage');
                render(containerRef);
            });
        });

        // Level cards click
        const levelCards = containerRef.querySelectorAll('.ma-level-card');
        levelCards.forEach(card => {
            card.addEventListener('click', () => {
                const levelId = parseInt(card.getAttribute('data-level-id'), 10);
                const progress = window.AppState ? window.AppState.getProgress() : { completedLevels: [] };
                const settings = window.AppState ? window.AppState.getSettings() : {};
                const statusInfo = getLevelStatus(levelId, progress, settings.passingThreshold || 70);

                if (statusInfo.status === 'locked') {
                    if (window.Toast) {
                        window.Toast.warning(`Level ${levelId} is locked. Complete Level ${levelId - 1} first!`);
                    }
                    return;
                }

                selectedLevelId = levelId;
                currentView = 'detail';
                activeTab = 'intro';
                initListeningSession();
                initTypingSession();
                resetExamSession();
                render(containerRef);
            });
        });
    } else {
        // Detail view back button
        const backBtn = containerRef.querySelector('#academy-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                clearAllTimers();
                currentView = 'map';
                render(containerRef);
            });
        }

        // Detail Tab switching
        const tabs = containerRef.querySelectorAll('.ma-tabs .ma-tab[data-tab]');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                const tab = t.getAttribute('data-tab');
                if (tab !== activeTab) {
                    clearAllTimers();
                    activeTab = tab;
                    if (activeTab === 'listening') {
                        initListeningSession();
                    } else if (activeTab === 'typing') {
                        initTypingSession();
                    }
                    render(containerRef);
                }
            });
        });

        // Bind active tab specific events
        if (activeTab === 'intro') {
            bindIntroEvents();
        } else if (activeTab === 'listening') {
            bindListeningEvents();
        } else if (activeTab === 'typing') {
            bindTypingEvents();
        } else if (activeTab === 'exam') {
            bindExamEvents();
        }
    }
}

// BIND INTRO EVENTS
function bindIntroEvents() {
    const playButtons = containerRef.querySelectorAll('.intro-char-play');
    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            safeAudioInit();
            const ch = btn.getAttribute('data-char');
            if (window.MorseAudio && ch) {
                window.MorseAudio.playChar(ch);
            }
        });
    });

    const playAllBtn = containerRef.querySelector('#intro-btn-play-all');
    if (playAllBtn) {
        playAllBtn.addEventListener('click', () => {
            safeAudioInit();
            const engine = window.MorseEngine;
            const level = engine ? engine.getLevel(selectedLevelId) : null;
            if (level && level.chars && window.MorseAudio) {
                window.MorseAudio.playSequence(level.chars.join(' '));
            }
        });
    }

    const nextTabBtn = containerRef.querySelector('#intro-btn-next-tab');
    if (nextTabBtn) {
        nextTabBtn.addEventListener('click', () => {
            activeTab = 'listening';
            initListeningSession();
            render(containerRef);
        });
    }
}

// -------------------------------------------------------------
// LISTENING TAB LOGIC
// -------------------------------------------------------------
function initListeningSession() {
    listenState = {
        round: 0,
        totalRounds: 10,
        score: 0,
        currentQuestion: null,
        answered: false,
        history: []
    };
    generateListeningQuestion();
}

function generateListeningQuestion() {
    const engine = window.MorseEngine;
    const progress = window.AppState ? window.AppState.getProgress() : { completedLevels: [] };
    const unlocked = engine ? engine.getUnlockedChars(progress.completedLevels || []) : ['K', 'M'];
    const level = engine ? engine.getLevel(selectedLevelId) : null;

    // Pool includes unlocked plus target level chars
    const pool = Array.from(new Set([...(unlocked || []), ...(level?.chars || ['K', 'M'])]));
    if (pool.length === 0) pool.push('K', 'M');

    // Pick target: 60% chance to test current level chars
    let target = pool[0];
    if (level?.chars && level.chars.length > 0 && Math.random() < 0.6) {
        target = level.chars[Math.floor(Math.random() * level.chars.length)];
    } else {
        target = pool[Math.floor(Math.random() * pool.length)];
    }

    // Pick 3 distractors
    const choices = new Set([target]);
    const fallbackLetters = ['E', 'T', 'A', 'N', 'M', 'K', 'S', 'O', 'I', 'R'];
    let attempts = 0;
    while (choices.size < Math.min(4, Math.max(pool.length, 4)) && attempts < 30) {
        attempts++;
        const candidate = pool.length >= 4
            ? pool[Math.floor(Math.random() * pool.length)]
            : fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
        choices.add(candidate);
    }

    listenState.currentQuestion = {
        target,
        morse: engine ? engine.charToMorse(target) : '',
        choices: Array.from(choices).sort(() => Math.random() - 0.5)
    };
    listenState.answered = false;
}

function playListeningQuestionAudio() {
    safeAudioInit();
    if (!window.MorseAudio || !listenState.currentQuestion) return;
    const playText = containerRef.querySelector('#listening-play-text');
    if (playText) playText.textContent = 'Playing...';

    window.MorseAudio.playChar(listenState.currentQuestion.target, {
        onComplete: () => {
            if (playText) playText.textContent = 'Replay Sound';
        }
    });
}

function bindListeningEvents() {
    // Play button
    const playBtn = containerRef.querySelector('#listening-btn-play');
    if (playBtn) {
        playBtn.addEventListener('click', playListeningQuestionAudio);
    }
    const replayFooter = containerRef.querySelector('#listening-btn-replay-footer');
    if (replayFooter) {
        replayFooter.addEventListener('click', playListeningQuestionAudio);
    }

    // Choice buttons
    const choiceButtons = containerRef.querySelectorAll('.listening-choice-btn');
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (listenState.answered) return;
            listenState.answered = true;

            const selected = btn.getAttribute('data-choice');
            const target = listenState.currentQuestion.target;
            const isCorrect = (selected === target);

            if (isCorrect) {
                listenState.score++;
                btn.style.background = 'var(--accent-green)';
                btn.style.color = '#0a0e17';
                btn.style.borderColor = 'var(--accent-green)';
            } else {
                btn.style.background = 'var(--accent-red)';
                btn.style.color = '#fff';
                btn.style.borderColor = 'var(--accent-red)';

                // Highlight correct button
                choiceButtons.forEach(b => {
                    if (b.getAttribute('data-choice') === target) {
                        b.style.background = 'var(--accent-green)';
                        b.style.color = '#0a0e17';
                        b.style.borderColor = 'var(--accent-green)';
                    }
                });
            }

            // Record character stats
            recordCharAttempt(target, isCorrect);

            const feedback = containerRef.querySelector('#listening-feedback');
            if (feedback) {
                feedback.innerHTML = isCorrect
                    ? `<span style="color: var(--accent-green); font-size: 1.15rem; font-weight: 700;">✓ Correct! Character: ${target}</span>`
                    : `<span style="color: var(--accent-red); font-size: 1.15rem; font-weight: 700;">✗ Wrong! The correct sound was "${target}"</span>`;
            }

            // Auto-advance after 1.2 seconds or enable Next button
            const t = setTimeout(() => {
                listenState.round++;
                if (listenState.round < listenState.totalRounds) {
                    generateListeningQuestion();
                } else {
                    logSessionToStats('listening', listenState.score, listenState.totalRounds);
                }
                render(containerRef);
            }, 1200);
            timers.push(t);
        });
    });

    const nextBtn = containerRef.querySelector('#listening-btn-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            listenState.round++;
            if (listenState.round < listenState.totalRounds) {
                generateListeningQuestion();
            } else {
                logSessionToStats('listening', listenState.score, listenState.totalRounds);
            }
            render(containerRef);
        });
    }

    const retryBtn = containerRef.querySelector('#listening-btn-retry');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            initListeningSession();
            render(containerRef);
        });
    }

    const toTypingBtn = containerRef.querySelector('#listening-btn-to-typing');
    if (toTypingBtn) {
        toTypingBtn.addEventListener('click', () => {
            activeTab = 'typing';
            initTypingSession();
            render(containerRef);
        });
    }
}

// -------------------------------------------------------------
// TYPING TAB LOGIC
// -------------------------------------------------------------
function initTypingSession() {
    typeState = {
        round: 0,
        totalRounds: 5,
        score: 0,
        currentSequence: '',
        answered: false,
        history: []
    };
    generateTypingSequence();
}

function generateTypingSequence() {
    const engine = window.MorseEngine;
    const progress = window.AppState ? window.AppState.getProgress() : { completedLevels: [] };
    const unlocked = engine ? engine.getUnlockedChars(progress.completedLevels || []) : ['K', 'M'];
    const level = engine ? engine.getLevel(selectedLevelId) : null;
    const pool = Array.from(new Set([...(unlocked || []), ...(level?.chars || ['K', 'M'])]));
    if (pool.length === 0) pool.push('K', 'M');

    // 3 to 4 characters sequence
    const length = Math.min(3 + (typeState.round % 2), 4);
    let seq = '';
    for (let i = 0; i < length; i++) {
        seq += pool[Math.floor(Math.random() * pool.length)];
    }

    typeState.currentSequence = seq;
    typeState.answered = false;
}

function playTypingSequenceAudio() {
    safeAudioInit();
    if (!window.MorseAudio || !typeState.currentSequence) return;
    const playText = containerRef.querySelector('#typing-play-text');
    if (playText) playText.textContent = 'Playing Sequence...';

    window.MorseAudio.playSequence(typeState.currentSequence, {
        onComplete: () => {
            if (playText) playText.textContent = `Replay Sequence (${typeState.currentSequence.length} characters)`;
        }
    });
}

function submitTypingAnswer() {
    if (typeState.answered) return;
    const input = containerRef.querySelector('#typing-input');
    if (!input) return;

    typeState.answered = true;
    const userVal = input.value.trim().toUpperCase();
    const correctVal = typeState.currentSequence;
    const isFullMatch = (userVal === correctVal);

    if (isFullMatch) {
        typeState.score++;
    }

    // Per-character evaluation and scoring
    const feedbackEl = containerRef.querySelector('#typing-feedback');
    if (feedbackEl) {
        let diffHTML = '';
        for (let i = 0; i < correctVal.length; i++) {
            const userCh = userVal[i] || '';
            const correctCh = correctVal[i];
            const isChMatch = (userCh === correctCh);
            recordCharAttempt(correctCh, isChMatch);

            diffHTML += `
                <span style="display: inline-block; padding: 0.3rem 0.6rem; margin: 0 0.25rem; border-radius: var(--border-radius-sm); font-size: 1.4rem; font-weight: 700; background: ${isChMatch ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)'}; color: ${isChMatch ? 'var(--accent-green)' : 'var(--accent-red)'}; border: 1px solid ${isChMatch ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${userCh || '_'}
                </span>
            `;
        }

        feedbackEl.innerHTML = `
            <div style="margin-bottom: 0.5rem;">${diffHTML}</div>
            <div style="font-size: 1rem; color: var(--text-secondary);">
                ${isFullMatch ? '<strong style="color: var(--accent-green);">Perfect match!</strong>' : `Expected sequence: <strong style="color: var(--accent-cyan); letter-spacing: 2px;">${correctVal}</strong>`}
            </div>
        `;
    }

    const t = setTimeout(() => {
        typeState.round++;
        if (typeState.round < typeState.totalRounds) {
            generateTypingSequence();
        } else {
            logSessionToStats('typing', typeState.score, typeState.totalRounds);
        }
        render(containerRef);
    }, 1800);
    timers.push(t);
}

function bindTypingEvents() {
    const playBtn = containerRef.querySelector('#typing-btn-play');
    if (playBtn) playBtn.addEventListener('click', playTypingSequenceAudio);

    const replayFooter = containerRef.querySelector('#typing-btn-replay-footer');
    if (replayFooter) replayFooter.addEventListener('click', playTypingSequenceAudio);

    const submitBtn = containerRef.querySelector('#typing-btn-submit');
    if (submitBtn) submitBtn.addEventListener('click', submitTypingAnswer);

    const input = containerRef.querySelector('#typing-input');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitTypingAnswer();
            }
        });
    }

    const retryBtn = containerRef.querySelector('#typing-btn-retry');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            initTypingSession();
            render(containerRef);
        });
    }

    const toExamBtn = containerRef.querySelector('#typing-btn-to-exam');
    if (toExamBtn) {
        toExamBtn.addEventListener('click', () => {
            activeTab = 'exam';
            resetExamSession();
            render(containerRef);
        });
    }
}

// -------------------------------------------------------------
// EXAM TAB LOGIC (20 QUESTIONS, TIMER, UNLOCK CRITERIA)
// -------------------------------------------------------------
function resetExamSession() {
    if (examState.timerInterval) {
        clearInterval(examState.timerInterval);
        examState.timerInterval = null;
    }
    examState = {
        active: false,
        questions: [],
        currentIndex: 0,
        score: 0,
        elapsedSeconds: 0,
        timerInterval: null,
        completed: false,
        answers: []
    };
}

function startExamSession() {
    const engine = window.MorseEngine;
    const progress = window.AppState ? window.AppState.getProgress() : { completedLevels: [] };
    const unlocked = engine ? engine.getUnlockedChars(progress.completedLevels || []) : ['K', 'M'];
    const level = engine ? engine.getLevel(selectedLevelId) : null;
    const pool = Array.from(new Set([...(unlocked || []), ...(level?.chars || ['K', 'M'])]));
    if (pool.length === 0) pool.push('K', 'M');

    // Build 20 questions: 10 Multiple Choice + 10 Typing
    const questions = [];
    const fallbackLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

    for (let i = 0; i < 20; i++) {
        const isMc = (i % 2 === 0);
        let target = '';

        if (isMc) {
            // Single character MC
            if (level?.chars && level.chars.length > 0 && Math.random() < 0.6) {
                target = level.chars[Math.floor(Math.random() * level.chars.length)];
            } else {
                target = pool[Math.floor(Math.random() * pool.length)];
            }

            const choices = new Set([target]);
            while (choices.size < Math.min(4, Math.max(pool.length, 4))) {
                const cand = pool.length >= 4
                    ? pool[Math.floor(Math.random() * pool.length)]
                    : fallbackLetters[Math.floor(Math.random() * fallbackLetters.length)];
                choices.add(cand);
            }

            questions.push({
                type: 'mc',
                target,
                morse: engine ? engine.charToMorse(target) : '',
                choices: Array.from(choices).sort(() => Math.random() - 0.5)
            });
        } else {
            // Typing (single character or 2-char group)
            const len = (i < 10) ? 1 : 2;
            let seq = '';
            for (let k = 0; k < len; k++) {
                seq += pool[Math.floor(Math.random() * pool.length)];
            }
            questions.push({
                type: 'typing',
                target: seq,
                morse: engine ? engine.textToMorse(seq) : ''
            });
        }
    }

    examState.active = true;
    examState.completed = false;
    examState.questions = questions;
    examState.currentIndex = 0;
    examState.score = 0;
    examState.elapsedSeconds = 0;
    examState.answers = [];

    // Start exam timer
    examState.timerInterval = setInterval(() => {
        examState.elapsedSeconds++;
    }, 1000);
    intervals.push(examState.timerInterval);

    render(containerRef);
    // Auto play first question tone
    const t = setTimeout(() => {
        playExamCurrentAudio();
    }, 400);
    timers.push(t);
}

function playExamCurrentAudio() {
    safeAudioInit();
    if (!window.MorseAudio || !examState.active || examState.completed) return;
    const currentQ = examState.questions[examState.currentIndex];
    if (!currentQ) return;

    const playText = containerRef.querySelector('#exam-play-text');
    if (playText) playText.textContent = 'Transmitting Audio...';

    const onDone = () => {
        if (playText) playText.textContent = 'Replay Prompt';
    };

    if (currentQ.type === 'mc') {
        window.MorseAudio.playChar(currentQ.target, { onComplete: onDone });
    } else {
        window.MorseAudio.playSequence(currentQ.target, { onComplete: onDone });
    }
}

function handleExamAnswer(userAnswer) {
    if (!examState.active || examState.completed) return;
    const currentQ = examState.questions[examState.currentIndex];
    if (!currentQ) return;

    const isCorrect = (userAnswer.trim().toUpperCase() === currentQ.target.trim().toUpperCase());
    if (isCorrect) {
        examState.score++;
    }

    // Record character stats
    if (currentQ.target.length === 1) {
        recordCharAttempt(currentQ.target, isCorrect);
    } else {
        for (const ch of currentQ.target) {
            recordCharAttempt(ch, isCorrect);
        }
    }

    examState.answers.push({
        index: examState.currentIndex + 1,
        type: currentQ.type === 'mc' ? 'Multiple Choice' : 'Typing',
        target: currentQ.target,
        userAnswer: userAnswer.trim().toUpperCase(),
        isCorrect
    });

    const flash = containerRef.querySelector('#exam-feedback-flash');
    if (flash) {
        flash.innerHTML = isCorrect
            ? '<span style="color: var(--accent-green); font-size: 1.15rem; font-weight: 700;">✓ Correct!</span>'
            : `<span style="color: var(--accent-red); font-size: 1.15rem; font-weight: 700;">✗ Expected: ${currentQ.target}</span>`;
    }

    // Auto-advance
    const t = setTimeout(() => {
        examState.currentIndex++;
        if (examState.currentIndex >= examState.questions.length) {
            finalizeExam();
        } else {
            render(containerRef);
            // Auto play next audio
            const t2 = setTimeout(() => {
                playExamCurrentAudio();
            }, 300);
            timers.push(t2);
        }
    }, 700);
    timers.push(t);
}

function finalizeExam() {
    examState.active = false;
    examState.completed = true;
    if (examState.timerInterval) {
        clearInterval(examState.timerInterval);
        examState.timerInterval = null;
    }

    const total = examState.questions.length;
    const scorePct = Math.round((examState.score / total) * 100);
    const passed = scorePct >= 70;

    // Apply unlock logic per §7
    if (window.AppState) {
        const curProgress = window.AppState.getProgress();
        const completedLevels = new Set(curProgress.completedLevels || []);
        const scores = { ...(curProgress.scores || {}) };

        scores[selectedLevelId] = Math.max(scores[selectedLevelId] || 0, scorePct);

        if (passed) {
            completedLevels.add(selectedLevelId);
            // If completed the current highest level, advance currentLevel
            if (curProgress.currentLevel === selectedLevelId) {
                curProgress.currentLevel = selectedLevelId + 1;
            }
        }

        window.AppState.setProgress({
            currentLevel: curProgress.currentLevel,
            completedLevels: Array.from(completedLevels),
            scores
        });
    }

    // Save practice session to stats
    logSessionToStats('exam', examState.score, total, examState.elapsedSeconds);

    // Call backend API safely
    if (window.MorseAPI) {
        window.MorseAPI.post('/progress/complete-level', {
            level_id: selectedLevelId,
            score: scorePct,
            accuracy: scorePct,
            time_spent: examState.elapsedSeconds
        }).catch(() => {});
    }

    if (window.Toast) {
        if (scorePct >= 95) {
            window.Toast.success(`⭐ Mastered Level ${selectedLevelId}! Score: ${scorePct}%`);
        } else if (passed) {
            window.Toast.success(`Level ${selectedLevelId} Passed! Next level unlocked.`);
        } else {
            window.Toast.info(`Level exam completed. Score: ${scorePct}%`);
        }
    }

    render(containerRef);
}

function bindExamEvents() {
    const startBtn = containerRef.querySelector('#exam-btn-start');
    if (startBtn) {
        startBtn.addEventListener('click', startExamSession);
    }

    const playBtn = containerRef.querySelector('#exam-btn-play');
    if (playBtn) {
        playBtn.addEventListener('click', playExamCurrentAudio);
    }

    const replayFooter = containerRef.querySelector('#exam-btn-replay-footer');
    if (replayFooter) {
        replayFooter.addEventListener('click', playExamCurrentAudio);
    }

    // MC choice clicks
    const mcButtons = containerRef.querySelectorAll('.exam-mc-btn');
    mcButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            handleExamAnswer(btn.getAttribute('data-choice'));
        });
    });

    // Typing submit
    const submitTypingBtn = containerRef.querySelector('#exam-btn-submit-typing');
    const typingInput = containerRef.querySelector('#exam-typing-input');
    if (submitTypingBtn && typingInput) {
        typingInput.focus();
        submitTypingBtn.addEventListener('click', () => {
            handleExamAnswer(typingInput.value);
        });
        typingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleExamAnswer(typingInput.value);
            }
        });
    }

    // Results screen actions
    const retryBtn = containerRef.querySelector('#exam-btn-retry');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            resetExamSession();
            startExamSession();
        });
    }

    const nextLevelBtn = containerRef.querySelector('#exam-btn-next-level');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            clearAllTimers();
            selectedLevelId = selectedLevelId + 1;
            activeTab = 'intro';
            initListeningSession();
            initTypingSession();
            resetExamSession();
            render(containerRef);
        });
    }

    const reviewBtn = containerRef.querySelector('#exam-btn-review-lesson');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', () => {
            clearAllTimers();
            activeTab = 'intro';
            render(containerRef);
        });
    }
}

// -------------------------------------------------------------
// STATS LOGGING HELPERS
// -------------------------------------------------------------
function recordCharAttempt(char, isCorrect) {
    if (!char || !window.AppState) return;
    const stats = window.AppState.getStats();
    const charPerf = { ...(stats.charPerformance || {}) };

    const current = charPerf[char] || { totalAttempts: 0, correctAttempts: 0, total_attempts: 0, correct_attempts: 0 };
    const totalAttempts = (current.totalAttempts || current.total_attempts || 0) + 1;
    const correctAttempts = (current.correctAttempts || current.correct_attempts || 0) + (isCorrect ? 1 : 0);

    charPerf[char] = {
        totalAttempts,
        correctAttempts,
        total_attempts: totalAttempts,
        correct_attempts: correctAttempts,
        accuracy: Math.round((correctAttempts / totalAttempts) * 100),
        lastPracticed: new Date().toISOString()
    };

    window.AppState.updateStats({ charPerformance: charPerf });

    if (window.MorseAPI) {
        window.MorseAPI.post('/practice/char-performance', {
            char,
            correct: isCorrect,
            response_time: 400
        }).catch(() => {});
    }
}

function logSessionToStats(type, correct, total, durationSeconds = 60) {
    if (!window.AppState) return;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const settings = window.AppState.getSettings();

    const sessionEntry = {
        date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        type,
        wpm: settings.wpm || 15,
        accuracy,
        score: accuracy,
        duration: durationSeconds
    };

    window.AppState.updateStats({
        sessions: (window.AppState.getStats().sessions || 0) + 1,
        totalTime: (window.AppState.getStats().totalTime || 0) + durationSeconds,
        history: [sessionEntry]
    });

    if (window.MorseAPI) {
        window.MorseAPI.post('/practice/session', sessionEntry).catch(() => {});
    }
}

// -------------------------------------------------------------
// PAGE CONTRACT EXPORTS
// -------------------------------------------------------------
export function render(container) {
    containerRef = container;
    const engine = window.MorseEngine;
    const curriculum = engine ? engine.getCurriculum() : [];
    const progress = window.AppState ? window.AppState.getProgress() : { completedLevels: [], scores: {} };
    const settings = window.AppState ? window.AppState.getSettings() : {};

    if (currentView === 'map') {
        container.innerHTML = renderLevelMapHTML(curriculum, progress, settings);
    } else {
        const level = engine ? (engine.getLevel(selectedLevelId) || curriculum[0]) : { level: selectedLevelId, stage: 1, title: 'Koch Lesson', chars: ['K', 'M'] };
        container.innerHTML = renderLevelDetailHTML(level, progress, settings);
    }

    bindAcademyEvents();
}

export function init() {
    safeAudioInit();
}

export function destroy() {
    clearAllTimers();
    containerRef = null;
}
