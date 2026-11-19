// Morse Academy — Games and Challenges Page
// All 8 functional game modes: Speed Race, Listen & Identify, Memory, Word Decoding, Callsigns, Daily Challenge, Survival, and Timed Accuracy

let containerRef = null;
let activeGame = 'speed-race'; // 'speed-race' | 'listen-identify' | 'memory' | 'word-decode' | 'callsigns' | 'daily' | 'survival' | 'timed-accuracy'
let gameTimer = null;
let gameActive = false;

// Shared Game State
let gameState = {
    score: 0,
    streak: 0,
    lives: 3,
    timeLeft: 60,
    currentRound: 1,
    targetItem: '',
    targetMorse: '',
    wpm: 15,
    memorySequence: [],
    memoryPlayerIndex: 0,
    dailyCompleted: false
};

const WORDS_POOL = [
    'RADIO', 'MORSE', 'SIGNAL', 'TOWER', 'SPEED', 'FLASH', 'AUDIO',
    'WORLD', 'STATION', 'ROGER', 'CWKEY', 'ANTENNA', 'POWER', 'PARIS'
];

const CALLSIGNS_POOL = [
    'W1AW', 'K6STI', 'N4ZR', 'G4ZFE', 'VK3UM', 'JA1ABC', 'DL7NDR', 'F5IN',
    'PY2XB', 'VE3KRG', 'ZL2AGY', 'EA4TX', 'I2WIJ', 'SM5AJV', 'OH2BB', 'ON4UN'
];

export function render(container) {
    containerRef = container;

    // Load High Scores
    const highScores = getStoredHighScores();

    container.innerHTML = `
        <div class="ma-page">
            <header class="ma-page__header">
                <div class="ma-flex" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 class="ma-h1">🎮 Morse Arcade & Challenges</h1>
                        <p class="ma-text">Test your Morse reflexes, memory, and speed across 8 exciting arcade challenge modes.</p>
                    </div>
                    <div class="ma-flex" style="gap: 0.5rem;">
                        <span class="ma-badge ma-badge--success" id="overall-games-played">
                            Games Played: ${getGamesPlayedCount()}
                        </span>
                    </div>
                </div>
            </header>

            <!-- Game Mode Navigation Tabs -->
            <div class="ma-tabs" style="margin-bottom: 1.5rem; overflow-x: auto; white-space: nowrap;">
                <button class="ma-tab ${activeGame === 'speed-race' ? 'ma-tab--active' : ''} game-nav-tab" data-game="speed-race">🏎️ Speed Race</button>
                <button class="ma-tab ${activeGame === 'listen-identify' ? 'ma-tab--active' : ''} game-nav-tab" data-game="listen-identify">⚡ Listen & Identify</button>
                <button class="ma-tab ${activeGame === 'memory' ? 'ma-tab--active' : ''} game-nav-tab" data-game="memory">🧠 Morse Memory</button>
                <button class="ma-tab ${activeGame === 'word-decode' ? 'ma-tab--active' : ''} game-nav-tab" data-game="word-decode">🔍 Word Decoder</button>
                <button class="ma-tab ${activeGame === 'callsigns' ? 'ma-tab--active' : ''} game-nav-tab" data-game="callsigns">📻 Callsign Pileup</button>
                <button class="ma-tab ${activeGame === 'daily' ? 'ma-tab--active' : ''} game-nav-tab" data-game="daily">📅 Daily Challenge</button>
                <button class="ma-tab ${activeGame === 'survival' ? 'ma-tab--active' : ''} game-nav-tab" data-game="survival">❤️ Survival Mode</button>
                <button class="ma-tab ${activeGame === 'timed-accuracy' ? 'ma-tab--active' : ''} game-nav-tab" data-game="timed-accuracy">⏱️ Timed Accuracy</button>
            </div>

            <!-- Main Interactive Game Arena -->
            <div class="ma-card" style="margin-bottom: 1.5rem;">
                <div class="ma-card__header" style="background: var(--bg-secondary);">
                    <div class="ma-flex" style="gap: 1rem; align-items: center;">
                        <h3 class="ma-h3" id="active-game-title">Morse Speed Race</h3>
                        <span class="ma-badge ma-badge--info" id="game-status-badge">Ready</span>
                    </div>
                    <div class="ma-flex" style="gap: 1.5rem; align-items: center;">
                        <div id="stat-lives-display" style="font-size: 1.25rem; display: none;">❤️❤️❤️</div>
                        <div>
                            <span class="ma-stat-label" style="display: inline; margin-right: 0.5rem;">SCORE:</span>
                            <strong id="stat-score-display" style="font-size: 1.5rem; color: var(--accent-cyan);">0</strong>
                        </div>
                        <div id="stat-timer-container">
                            <span class="ma-stat-label" style="display: inline; margin-right: 0.5rem;">TIME:</span>
                            <strong id="stat-timer-display" style="font-size: 1.5rem; font-family: monospace; color: var(--accent-amber);">60s</strong>
                        </div>
                    </div>
                </div>

                <div class="ma-card__body" style="text-align: center; padding: 2.5rem 1.5rem; min-height: 300px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <!-- Game Description & Start Panel (When idle) -->
                    <div id="game-idle-panel" style="max-width: 500px;">
                        <div id="game-desc-icon" style="font-size: 3.5rem; margin-bottom: 1rem;">🏎️</div>
                        <h2 class="ma-h2" id="game-desc-title">Morse Speed Race</h2>
                        <p class="ma-text" id="game-desc-text" style="margin: 1rem 0 1.5rem;">
                            Words stream in at increasing speed. Decode each word before the timer expires!
                        </p>
                        <button id="btn-start-game" class="ma-btn ma-btn--primary ma-btn--lg" style="min-width: 200px;">
                            ▶️ Start Challenge
                        </button>
                    </div>

                    <!-- Active Play Field -->
                    <div id="game-play-panel" style="display: none; width: 100%; max-width: 560px;">
                        <!-- Race Progress Tracker -->
                        <div id="race-progress-container" style="margin-bottom: 1.5rem; display: none;">
                            <div class="ma-progress">
                                <div id="race-progress-bar" class="ma-progress__bar ma-progress__bar--cyan" style="width: 100%;"></div>
                            </div>
                        </div>

                        <!-- Audio Playback / Visualizer Indicator -->
                        <div id="game-sound-indicator" style="width: 80px; height: 80px; border-radius: 50%; background: var(--bg-secondary); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.25rem;">
                            🔊
                        </div>

                        <!-- Target Visual / Prompt (Depending on mode) -->
                        <div id="game-target-display" style="font-size: 2.25rem; font-weight: 800; font-family: monospace; letter-spacing: 0.15em; min-height: 48px; margin-bottom: 1rem; color: var(--accent-cyan);">
                            —
                        </div>

                        <!-- Memory Sequence Light Buttons (Only in memory mode) -->
                        <div id="memory-buttons-container" style="display: none; justify-content: center; gap: 1rem; margin-bottom: 1.5rem;">
                            <button class="ma-btn ma-btn--secondary memory-pad-btn" data-char="A" style="width: 70px; height: 70px; font-size: 1.5rem; font-weight: bold;">A</button>
                            <button class="ma-btn ma-btn--primary memory-pad-btn" data-char="B" style="width: 70px; height: 70px; font-size: 1.5rem; font-weight: bold;">B</button>
                            <button class="ma-btn ma-btn--success memory-pad-btn" data-char="C" style="width: 70px; height: 70px; font-size: 1.5rem; font-weight: bold;">C</button>
                            <button class="ma-btn ma-btn--danger memory-pad-btn" data-char="D" style="width: 70px; height: 70px; font-size: 1.5rem; font-weight: bold;">D</button>
                        </div>

                        <!-- 4 Multiple Choice Buttons (Only in Listen & Identify) -->
                        <div id="identify-choices-container" style="display: none; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
                            <!-- Filled dynamically -->
                        </div>

                        <!-- Standard Text Input Form (For text entry modes) -->
                        <div id="game-input-container">
                            <form id="game-answer-form" onsubmit="return false;">
                                <div class="ma-input-group">
                                    <input type="text" id="game-text-input" class="ma-input" placeholder="Type answer..." autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" style="font-size: 1.5rem; text-align: center; text-transform: uppercase; font-family: monospace; letter-spacing: 0.15em;">
                                </div>
                                <button type="submit" id="game-submit-btn" class="ma-btn ma-btn--success" style="width: 100%; margin-top: 0.75rem;">
                                    Submit [Enter]
                                </button>
                            </form>
                        </div>

                        <!-- Feedback Line -->
                        <div id="game-feedback-line" style="margin-top: 1rem; font-weight: 700; min-height: 24px;"></div>
                    </div>
                </div>

                <div class="ma-card__footer" style="justify-content: space-between;">
                    <div id="personal-high-score-text" class="ma-text--muted" style="font-size: 0.875rem;">
                        High Score: ${highScores[activeGame] || 0} pts
                    </div>
                    <button id="btn-replay-audio" class="ma-btn ma-btn--ghost ma-btn--sm">
                        🔄 Replay Morse Audio
                    </button>
                </div>
            </div>

            <!-- Arcade Leaderboard & Game Records Strip -->
            <div class="ma-grid ma-grid--2col" style="gap: 1.5rem;">
                <!-- Hall of Fame / Records -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">🏆 Personal Best Records</h3>
                    </div>
                    <div class="ma-card__body" style="padding: 0;">
                        <table class="ma-table">
                            <thead>
                                <tr>
                                    <th>Challenge Mode</th>
                                    <th>High Score</th>
                                    <th>Rank</th>
                                </tr>
                            </thead>
                            <tbody id="arcade-records-tbody">
                                <!-- Populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Game Achievements Unlock Info -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h3 class="ma-h3">🎖️ Arcade Achievements</h3>
                    </div>
                    <div class="ma-card__body">
                        <div class="ma-grid ma-grid--2col" style="gap: 1rem;">
                            <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px;">
                                <div style="font-size: 1.25rem;">🎮</div>
                                <strong>Arcade Enthusiast</strong>
                                <p class="ma-text--muted" style="font-size: 0.75rem;">Play 10 Arcade Games</p>
                                <span class="ma-badge ${getGamesPlayedCount() >= 10 ? 'ma-badge--success' : 'ma-badge--info'}" style="margin-top: 0.25rem;">
                                    ${getGamesPlayedCount() >= 10 ? 'UNLOCKED' : `${getGamesPlayedCount()} / 10`}
                                </span>
                            </div>
                            <div style="background: var(--bg-secondary); padding: 0.75rem 1rem; border-radius: 6px;">
                                <div style="font-size: 1.25rem;">👑</div>
                                <strong>Arcade Veteran</strong>
                                <p class="ma-text--muted" style="font-size: 0.75rem;">Play 50 Arcade Games</p>
                                <span class="ma-badge ${getGamesPlayedCount() >= 50 ? 'ma-badge--success' : 'ma-badge--info'}" style="margin-top: 0.25rem;">
                                    ${getGamesPlayedCount() >= 50 ? 'UNLOCKED' : `${getGamesPlayedCount()} / 50`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    attachEventListeners();
    updateRecordsTable();
}

function attachEventListeners() {
    if (!containerRef) return;

    // Navigation Tabs
    const tabs = containerRef.querySelectorAll('.game-nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            endCurrentGame();
            activeGame = e.currentTarget.getAttribute('data-game');
            tabs.forEach(t => t.className = t === e.currentTarget ? 'ma-tab ma-tab--active game-nav-tab' : 'ma-tab game-nav-tab');
            updateGameModePanel();
        });
    });

    // Start Button
    const startBtn = containerRef.querySelector('#btn-start-game');
    if (startBtn) startBtn.addEventListener('click', startCurrentGame);

    // Replay Audio Button
    const replayBtn = containerRef.querySelector('#btn-replay-audio');
    if (replayBtn) replayBtn.addEventListener('click', playTargetAudio);

    // Form
    const form = containerRef.querySelector('#game-answer-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            evaluateGameAnswer();
        });
    }

    // Memory Pad Buttons
    const memBtns = containerRef.querySelectorAll('.memory-pad-btn');
    memBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ch = e.currentTarget.getAttribute('data-char');
            handleMemoryInput(ch);
        });
    });
}

function updateGameModePanel() {
    if (!containerRef) return;

    const titles = {
        'speed-race': { title: 'Morse Speed Race', icon: '🏎️', desc: 'Words rush across the clock! Transcribe each word before the fuse runs out. Speeds increase with every win.' },
        'listen-identify': { title: 'Listen and Identify', icon: '⚡', desc: 'Hear a high-speed Morse letter or number. Click the correct match or press the key instantly!' },
        'memory': { title: 'Morse Memory Challenge', icon: '🧠', desc: 'Simon-says style audio Morse memory. Listen to the sequence of tones and repeat it back correctly.' },
        'word-decode': { title: 'Word Decoding Challenge', icon: '🔍', desc: 'Mystery words transmitted in Morse. Listen closely and decipher the hidden word.' },
        'callsigns': { title: 'Callsign Pileup Challenge', icon: '📻', desc: '60-second pileup frenzy! Transcribe as many authentic amateur radio callsigns as possible.' },
        'daily': { title: 'Daily Morse Challenge', icon: '📅', desc: `Deterministic 10-puzzle challenge for ${new Date().toISOString().slice(0, 10)}. Compete with operators worldwide!` },
        'survival': { title: 'Survival Mode (3 Lives)', icon: '❤️', desc: 'Start with 3 hearts. Morse streams in faster every round (+1 WPM). One mistake costs a life!' },
        'timed-accuracy': { title: 'Timed Accuracy Challenge', icon: '⏱️', desc: '60 seconds on the clock. Copy as many codes as possible. High combo streaks grant bonus score!' }
    };

    const info = titles[activeGame] || titles['speed-race'];

    containerRef.querySelector('#active-game-title').textContent = info.title;
    containerRef.querySelector('#game-desc-title').textContent = info.title;
    containerRef.querySelector('#game-desc-icon').textContent = info.icon;
    containerRef.querySelector('#game-desc-text').textContent = info.desc;

    // Reset Panels
    containerRef.querySelector('#game-idle-panel').style.display = 'block';
    containerRef.querySelector('#game-play-panel').style.display = 'none';

    // Update High Score Display
    const highScores = getStoredHighScores();
    const hsEl = containerRef.querySelector('#personal-high-score-text');
    if (hsEl) hsEl.textContent = `High Score: ${highScores[activeGame] || 0} pts`;
}

function startCurrentGame() {
    gameActive = true;
    gameState.score = 0;
    gameState.streak = 0;
    gameState.lives = 3;
    gameState.currentRound = 1;
    gameState.timeLeft = activeGame === 'callsigns' || activeGame === 'timed-accuracy' ? 60 : 30;
    gameState.wpm = 15;
    gameState.memorySequence = [];

    if (!containerRef) return;
    containerRef.querySelector('#game-idle-panel').style.display = 'none';
    containerRef.querySelector('#game-play-panel').style.display = 'block';
    containerRef.querySelector('#game-status-badge').textContent = 'ACTIVE';
    containerRef.querySelector('#game-status-badge').className = 'ma-badge ma-badge--success';
    containerRef.querySelector('#stat-score-display').textContent = '0';

    const livesDisplay = containerRef.querySelector('#stat-lives-display');
    if (livesDisplay) {
        livesDisplay.style.display = activeGame === 'survival' ? 'block' : 'none';
        livesDisplay.textContent = '❤️❤️❤️';
    }

    const raceProg = containerRef.querySelector('#race-progress-container');
    if (raceProg) {
        raceProg.style.display = activeGame === 'speed-race' ? 'block' : 'none';
    }

    const memContainer = containerRef.querySelector('#memory-buttons-container');
    const inputContainer = containerRef.querySelector('#game-input-container');
    const identifyContainer = containerRef.querySelector('#identify-choices-container');

    if (activeGame === 'memory') {
        memContainer.style.display = 'flex';
        inputContainer.style.display = 'none';
        identifyContainer.style.display = 'none';
    } else if (activeGame === 'listen-identify') {
        memContainer.style.display = 'none';
        inputContainer.style.display = 'none';
        identifyContainer.style.display = 'grid';
    } else {
        memContainer.style.display = 'none';
        inputContainer.style.display = 'block';
        identifyContainer.style.display = 'none';
    }

    // Start Timer if timed mode
    if (activeGame === 'callsigns' || activeGame === 'timed-accuracy' || activeGame === 'speed-race') {
        startTimer();
    }

    nextGameRound();
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    updateTimerUI();

    gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerUI();

        if (activeGame === 'speed-race') {
            const bar = containerRef ? containerRef.querySelector('#race-progress-bar') : null;
            if (bar) {
                const pct = Math.max(0, (gameState.timeLeft / 20) * 100);
                bar.style.width = `${pct}%`;
            }
        }

        if (gameState.timeLeft <= 0) {
            endCurrentGame();
        }
    }, 1000);
}

function updateTimerUI() {
    if (!containerRef) return;
    const timerEl = containerRef.querySelector('#stat-timer-display');
    if (timerEl) timerEl.textContent = `${gameState.timeLeft}s`;
}

function nextGameRound() {
    if (!gameActive) return;

    const feedback = containerRef ? containerRef.querySelector('#game-feedback-line') : null;
    if (feedback) feedback.textContent = '';

    const input = containerRef ? containerRef.querySelector('#game-text-input') : null;
    if (input) {
        input.value = '';
        input.focus();
    }

    if (activeGame === 'speed-race') {
        gameState.timeLeft = Math.max(8, 20 - Math.floor(gameState.currentRound * 1.5));
        gameState.targetItem = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
        gameState.wpm = 14 + gameState.currentRound;
        playTargetAudio();
    } else if (activeGame === 'listen-identify') {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        gameState.targetItem = letters[Math.floor(Math.random() * letters.length)];
        renderIdentifyChoices(gameState.targetItem);
        playTargetAudio();
    } else if (activeGame === 'memory') {
        const options = ['A', 'B', 'C', 'D'];
        gameState.memorySequence.push(options[Math.floor(Math.random() * options.length)]);
        gameState.memoryPlayerIndex = 0;
        playMemorySequence();
    } else if (activeGame === 'word-decode') {
        gameState.targetItem = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
        // Show masked word with hint e.g. "R _ _ _ O"
        const masked = gameState.targetItem[0] + ' ' + '_ '.repeat(gameState.targetItem.length - 2) + gameState.targetItem[gameState.targetItem.length - 1];
        if (containerRef) containerRef.querySelector('#game-target-display').textContent = masked;
        playTargetAudio();
    } else if (activeGame === 'callsigns') {
        gameState.targetItem = CALLSIGNS_POOL[Math.floor(Math.random() * CALLSIGNS_POOL.length)];
        playTargetAudio();
    } else if (activeGame === 'daily') {
        // Deterministic daily word based on date
        const dateStr = new Date().toISOString().slice(0, 10);
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
        const index = Math.abs(hash + gameState.currentRound) % WORDS_POOL.length;
        gameState.targetItem = WORDS_POOL[index];
        playTargetAudio();
    } else if (activeGame === 'survival') {
        gameState.wpm = 10 + gameState.currentRound;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        gameState.targetItem = letters[Math.floor(Math.random() * letters.length)];
        playTargetAudio();
    } else if (activeGame === 'timed-accuracy') {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        gameState.targetItem = letters[Math.floor(Math.random() * letters.length)];
        playTargetAudio();
    }
}

function renderIdentifyChoices(target) {
    if (!containerRef) return;
    const container = containerRef.querySelector('#identify-choices-container');
    if (!container) return;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const choices = new Set([target]);
    while (choices.size < 4) {
        choices.add(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }

    const arr = Array.from(choices).sort(() => Math.random() - 0.5);
    container.innerHTML = arr.map(ch => `
        <button class="ma-btn ma-btn--secondary identify-choice-btn" data-choice="${ch}" style="padding: 1rem; font-size: 1.5rem; font-weight: bold;">
            ${ch}
        </button>
    `).join('');

    container.querySelectorAll('.identify-choice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const chosen = e.currentTarget.getAttribute('data-choice');
            processAnswer(chosen);
        });
    });
}

function playTargetAudio() {
    if (!gameState.targetItem) return;
    if (window.MorseAudio) {
        window.MorseAudio.init();
        window.MorseAudio.playSequence(gameState.targetItem, {
            wpm: gameState.wpm,
            frequency: 650,
            volume: 0.75
        });
    }
}

function playMemorySequence() {
    if (window.MorseAudio) {
        window.MorseAudio.init();
        const text = gameState.memorySequence.join(' ');
        window.MorseAudio.playSequence(text, {
            wpm: 15,
            frequency: 650,
            volume: 0.75
        });
    }
}

function handleMemoryInput(char) {
    if (!gameActive || activeGame !== 'memory') return;

    const expected = gameState.memorySequence[gameState.memoryPlayerIndex];
    if (char === expected) {
        gameState.memoryPlayerIndex++;
        if (gameState.memoryPlayerIndex >= gameState.memorySequence.length) {
            // Sequence completed!
            gameState.score += gameState.memorySequence.length * 50;
            gameState.currentRound++;
            updateScoreUI();
            if (window.Toast) window.Toast.success(`Level ${gameState.currentRound} complete!`);
            setTimeout(nextGameRound, 1000);
        }
    } else {
        // Mistake in memory sequence
        endCurrentGame();
    }
}

function evaluateGameAnswer() {
    if (!containerRef || !gameActive) return;
    const input = containerRef.querySelector('#game-text-input');
    if (!input) return;

    const val = input.value.trim().toUpperCase();
    processAnswer(val);
}

function processAnswer(userAnswer) {
    const expected = gameState.targetItem.trim().toUpperCase();
    const isCorrect = userAnswer === expected;
    const feedback = containerRef ? containerRef.querySelector('#game-feedback-line') : null;

    if (isCorrect) {
        gameState.streak++;
        const multiplier = Math.min(4, 1 + Math.floor(gameState.streak / 3));
        const pts = (100 * multiplier) + (gameState.currentRound * 10);
        gameState.score += pts;
        gameState.currentRound++;

        if (feedback) {
            feedback.innerHTML = `<span style="color: var(--accent-green);">✓ Correct! +${pts} pts ${multiplier > 1 ? `(${multiplier}x Streak!)` : ''}</span>`;
        }

        updateScoreUI();
        setTimeout(nextGameRound, 600);
    } else {
        gameState.streak = 0;
        if (feedback) {
            feedback.innerHTML = `<span style="color: var(--accent-red);">Expected [${expected}], entered [${userAnswer}]</span>`;
        }

        if (activeGame === 'survival') {
            gameState.lives--;
            updateLivesUI();
            if (gameState.lives <= 0) {
                endCurrentGame();
                return;
            }
        }

        setTimeout(nextGameRound, 1000);
    }
}

function updateScoreUI() {
    if (!containerRef) return;
    const el = containerRef.querySelector('#stat-score-display');
    if (el) el.textContent = gameState.score;
}

function updateLivesUI() {
    if (!containerRef) return;
    const livesEl = containerRef.querySelector('#stat-lives-display');
    if (livesEl) {
        livesEl.textContent = '❤️'.repeat(Math.max(0, gameState.lives));
    }
}

function endCurrentGame() {
    if (!gameActive) return;
    gameActive = false;

    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    if (window.MorseAudio) window.MorseAudio.stop();

    // Save Score
    saveHighScore(activeGame, gameState.score);
    incrementGamesPlayed();

    if (containerRef) {
        containerRef.querySelector('#game-status-badge').textContent = 'GAME OVER';
        containerRef.querySelector('#game-status-badge').className = 'ma-badge ma-badge--danger';

        const feedback = containerRef.querySelector('#game-feedback-line');
        if (feedback) {
            feedback.innerHTML = `<span style="color: var(--accent-amber); font-size: 1.25rem;">Game Over! Final Score: ${gameState.score}</span>`;
        }

        setTimeout(() => {
            updateGameModePanel();
            updateRecordsTable();
        }, 2000);
    }
}

function getStoredHighScores() {
    if (window.AppState) {
        return window.AppState.get('morseGameScores', {});
    }
    return {};
}

function saveHighScore(game, score) {
    if (window.AppState) {
        const scores = getStoredHighScores();
        if (score > (scores[game] || 0)) {
            scores[game] = score;
            window.AppState.set('morseGameScores', scores);
            if (window.Toast) window.Toast.success(`🏆 New High Score in ${game}: ${score} pts!`);
        }
    }
}

function getGamesPlayedCount() {
    if (window.AppState) {
        return window.AppState.get('morseGamesCount', 0);
    }
    return 0;
}

function incrementGamesPlayed() {
    if (window.AppState) {
        const cnt = getGamesPlayedCount() + 1;
        window.AppState.set('morseGamesCount', cnt);

        // Check Arcade achievements
        if (cnt >= 10) {
            window.AppState.updateStats({ achievements: ['games_played_10'] });
        }
        if (cnt >= 50) {
            window.AppState.updateStats({ achievements: ['games_played_50'] });
        }

        const countEl = containerRef ? containerRef.querySelector('#overall-games-played') : null;
        if (countEl) countEl.textContent = `Games Played: ${cnt}`;
    }
}

function updateRecordsTable() {
    if (!containerRef) return;
    const tbody = containerRef.querySelector('#arcade-records-tbody');
    if (!tbody) return;

    const scores = getStoredHighScores();
    const modes = [
        { id: 'speed-race', label: '🏎️ Speed Race' },
        { id: 'listen-identify', label: '⚡ Listen & Identify' },
        { id: 'memory', label: '🧠 Morse Memory' },
        { id: 'word-decode', label: '🔍 Word Decoder' },
        { id: 'callsigns', label: '📻 Callsign Pileup' },
        { id: 'daily', label: '📅 Daily Challenge' },
        { id: 'survival', label: '❤️ Survival Mode' },
        { id: 'timed-accuracy', label: '⏱️ Timed Accuracy' }
    ];

    tbody.innerHTML = modes.map(m => {
        const score = scores[m.id] || 0;
        let rank = 'Novice';
        if (score > 1000) rank = 'Master';
        else if (score > 500) rank = 'Expert';
        else if (score > 200) rank = 'Skilled';

        return `
            <tr>
                <td><strong>${m.label}</strong></td>
                <td style="color: var(--accent-cyan); font-weight: 700;">${score} pts</td>
                <td><span class="ma-badge ${score > 500 ? 'ma-badge--success' : 'ma-badge--info'}">${rank}</span></td>
            </tr>
        `;
    }).join('');
}

export function init() {
    updateGameModePanel();
}

export function destroy() {
    endCurrentGame();
    containerRef = null;
}
