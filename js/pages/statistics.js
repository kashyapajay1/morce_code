// Morse Academy — Statistics Page
// Analytics dashboard, character performance heatmap, session history, and achievement badges

let containerRef = null;
let selectedCharDetail = null;

const ALL_ACHIEVEMENTS = [
    { key: 'first_lesson', name: 'First Step', icon: '🌱', desc: 'Completed your first lesson' },
    { key: 'first_pass', name: 'Certified', icon: '📜', desc: 'Passed a level exam' },
    { key: 'first_excellent', name: 'Perfectionist', icon: '⭐', desc: 'Scored 95%+ on a level exam' },
    { key: 'all_letters', name: 'Alphabet Master', icon: '🔤', desc: 'Learned all 26 letters' },
    { key: 'all_numbers', name: 'Number Cruncher', icon: '🔢', desc: 'Learned all 10 digits' },
    { key: 'all_punctuation', name: 'Grammarian', icon: '✍️', desc: 'Learned all punctuation marks' },
    { key: 'level_5', name: 'Cadet', icon: '🎖️', desc: 'Reached Level 5 in Morse Academy' },
    { key: 'level_10', name: 'Radio Operator', icon: '📻', desc: 'Reached Level 10' },
    { key: 'level_15', name: 'Senior Operator', icon: '📡', desc: 'Reached Level 15' },
    { key: 'level_20', name: 'Master Operator', icon: '👑', desc: 'Reached Level 20' },
    { key: 'speed_10wpm', name: '10 WPM Club', icon: '⚡', desc: 'Copied Morse at 10 WPM' },
    { key: 'speed_15wpm', name: '15 WPM Club', icon: '🚀', desc: 'Copied Morse at 15 WPM' },
    { key: 'speed_20wpm', name: '20 WPM Club', icon: '🔥', desc: 'Copied Morse at 20 WPM' },
    { key: 'speed_25wpm', name: 'High Speed CW', icon: '💫', desc: 'Copied Morse at 25 WPM' },
    { key: 'streak_3', name: 'Consistency', icon: '🗓️', desc: '3-day practice streak' },
    { key: 'streak_7', name: 'Dedication', icon: '🛡️', desc: '7-day practice streak' },
    { key: 'streak_14', name: 'Fortitude', icon: '⚔️', desc: '14-day practice streak' },
    { key: 'streak_30', name: 'Morse Habit', icon: '🏆', desc: '30-day practice streak' },
    { key: 'accuracy_90', name: 'Sharp Ears', icon: '🎯', desc: 'Reached 90% overall accuracy' },
    { key: 'accuracy_95', name: 'Golden Ear', icon: '🥇', desc: 'Reached 95% overall accuracy' },
    { key: 'accuracy_100', name: 'Flawless', icon: '💎', desc: 'Achieved 100% on a full session' },
    { key: 'total_time_1h', name: 'Novice Hours', icon: '⏳', desc: '1 hour of total training time' },
    { key: 'total_time_10h', name: 'Dedicated CW', icon: '⏱️', desc: '10 hours of training time' },
    { key: 'total_time_50h', name: 'Veteran', icon: '🌌', desc: '50 hours of training time' },
    { key: 'games_played_10', name: 'Gamer', icon: '🎮', desc: 'Played 10 challenge games' },
    { key: 'games_played_50', name: 'Arcade Champ', icon: '👾', desc: 'Played 50 games' },
    { key: 'perfect_exam', name: 'Bullseye', icon: '🎯', desc: '100% score on a level exam' },
    { key: 'ham_ready', name: 'On the Air', icon: '🎙️', desc: 'Completed Stage 6 Ham Radio' },
    { key: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Over 30 WPM mastered' }
];

function formatTime(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '0m';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function calculateAverageAccuracy(stats) {
    const history = stats?.history || [];
    if (history.length === 0) {
        // Fallback to charPerformance
        const charPerf = Object.values(stats?.charPerformance || {});
        if (charPerf.length === 0) return 0;
        let total = 0;
        let correct = 0;
        charPerf.forEach(c => {
            total += (c.totalAttempts || c.total_attempts || 0);
            correct += (c.correctAttempts || c.correct_attempts || 0);
        });
        return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    const items = history.filter(h => typeof h.accuracy === 'number' || typeof h.score === 'number');
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, h) => acc + (h.accuracy !== undefined ? h.accuracy : h.score), 0);
    return Math.round(sum / items.length);
}

function getMasteredCharactersCount(charPerformance) {
    let count = 0;
    for (const data of Object.values(charPerformance || {})) {
        const total = data.totalAttempts || data.total_attempts || 0;
        const correct = data.correctAttempts || data.correct_attempts || 0;
        if (total >= 5 && (correct / total) >= 0.9) {
            count++;
        }
    }
    return count;
}

function getUnlockedAchievements(progress, stats, settings) {
    const unlocked = new Set(progress?.achievements || []);

    // Check conditions
    if (stats.history && stats.history.length > 0) unlocked.add('first_lesson');
    if (progress.completedLevels && progress.completedLevels.length > 0) unlocked.add('first_pass');

    const scores = Object.values(progress.scores || {});
    if (scores.some(s => s >= 95)) unlocked.add('first_excellent');
    if (scores.some(s => s === 100)) unlocked.add('perfect_exam');

    const curLevel = progress.currentLevel || 1;
    if (curLevel >= 5 || (progress.completedLevels || []).includes(5)) unlocked.add('level_5');
    if (curLevel >= 10 || (progress.completedLevels || []).includes(10)) unlocked.add('level_10');
    if (curLevel >= 15 || (progress.completedLevels || []).includes(15)) unlocked.add('level_15');
    if (curLevel >= 20 || (progress.completedLevels || []).includes(20)) unlocked.add('level_20');

    const completed = new Set(progress.completedLevels || []);
    // Letters are levels 1-13
    let allLet = true;
    for (let l = 1; l <= 13; l++) { if (!completed.has(l)) { allLet = false; break; } }
    if (allLet && completed.size >= 13) unlocked.add('all_letters');

    // Numbers are levels 14-18
    let allNum = true;
    for (let l = 14; l <= 18; l++) { if (!completed.has(l)) { allNum = false; break; } }
    if (allNum && completed.size >= 18) unlocked.add('all_numbers');

    const streak = stats.streak || 0;
    if (streak >= 3) unlocked.add('streak_3');
    if (streak >= 7) unlocked.add('streak_7');
    if (streak >= 14) unlocked.add('streak_14');
    if (streak >= 30) unlocked.add('streak_30');

    const time = stats.totalTime || 0;
    if (time >= 3600) unlocked.add('total_time_1h');
    if (time >= 36000) unlocked.add('total_time_10h');
    if (time >= 180000) unlocked.add('total_time_50h');

    const highestWpm = stats.highestWpm || settings.wpm || 15;
    if (highestWpm >= 10) unlocked.add('speed_10wpm');
    if (highestWpm >= 15) unlocked.add('speed_15wpm');
    if (highestWpm >= 20) unlocked.add('speed_20wpm');
    if (highestWpm >= 25) unlocked.add('speed_25wpm');
    if (highestWpm >= 30) unlocked.add('speed_demon');

    return unlocked;
}

function renderStatisticsHTML() {
    const stats = window.AppState ? window.AppState.getStats() : { totalTime: 0, sessions: 0, history: [], charPerformance: {}, streak: 0 };
    const progress = window.AppState ? window.AppState.getProgress() : { currentLevel: 1, completedLevels: [], scores: {}, achievements: [] };
    const settings = window.AppState ? window.AppState.getSettings() : { wpm: 15 };
    const engine = window.MorseEngine;

    const avgAccuracy = calculateAverageAccuracy(stats);
    const masteredCount = getMasteredCharactersCount(stats.charPerformance);
    const unlockedAchievements = getUnlockedAchievements(progress, stats, settings);

    const charPerf = stats.charPerformance || {};
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?=/'.split('');

    // Weakest characters
    const weakList = [];
    for (const [char, data] of Object.entries(charPerf)) {
        const total = data.totalAttempts || data.total_attempts || 0;
        const correct = data.correctAttempts || data.correct_attempts || 0;
        if (total > 0) {
            weakList.push({
                char,
                total,
                correct,
                accuracy: Math.round((correct / total) * 100),
                morse: engine ? engine.charToMorse(char) : ''
            });
        }
    }
    weakList.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
    const topWeak = weakList.slice(0, 5);

    // Practice History (last 20)
    const history = (stats.history || []).slice(-20).reverse();

    return `
    <div class="ma-page ma-fade-in">
        <header class="ma-page__header" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem;">
            <div>
                <h1 class="ma-h1">Performance Statistics</h1>
                <p class="ma-text ma-text--muted">Detailed telemetry, character accuracy heatmap, practice history, and unlocked achievements.</p>
            </div>
            <button id="stats-btn-export" class="ma-btn ma-btn--secondary">
                <span>📥 Export Statistics (JSON)</span>
            </button>
        </header>

        <!-- Stats Overview 6-Card Grid -->
        <section class="ma-section" style="margin-bottom: 2rem;">
            <div class="ma-grid ma-grid--3col" style="gap: 1.25rem;">
                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${formatTime(stats.totalTime)}</div>
                        <div class="ma-stat-label">Total Practice Time</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${stats.sessions || 0}</div>
                        <div class="ma-stat-label">Total Sessions Completed</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value" style="color: ${avgAccuracy >= 85 ? 'var(--accent-green)' : (avgAccuracy >= 70 ? 'var(--accent-amber)' : 'var(--text-primary)')};">
                            ${avgAccuracy}%
                        </div>
                        <div class="ma-stat-label">Average Accuracy</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${settings.wpm || 15} WPM</div>
                        <div class="ma-stat-label">Current Target Speed</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${Math.max(stats.highestWpm || 0, settings.wpm || 15)} WPM</div>
                        <div class="ma-stat-label">Highest Speed Reached</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value" style="color: var(--accent-cyan);">${masteredCount}</div>
                        <div class="ma-stat-label">Characters Mastered (>90%)</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Character Performance Heatmap Grid -->
        <div class="ma-card" style="margin-bottom: 2rem;">
            <div class="ma-card__header" style="justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h2 class="ma-h3">Character Performance Heatmap</h2>
                    <p class="ma-text ma-text--muted">Click any character block to inspect detailed accuracy and response times.</p>
                </div>
                <!-- Heatmap Legend -->
                <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--accent-green); display: inline-block;"></span>
                        <span>>90% Mastered</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--accent-amber); display: inline-block;"></span>
                        <span>70–90% Good</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--accent-red); display: inline-block;"></span>
                        <span>&lt;70% Focus</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--border-color); display: inline-block;"></span>
                        <span>Unpracticed</span>
                    </div>
                </div>
            </div>

            <div class="ma-card__body">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 0.75rem;">
                    ${alphabet.map(ch => {
                        const data = charPerf[ch];
                        const total = data ? (data.totalAttempts || data.total_attempts || 0) : 0;
                        const correct = data ? (data.correctAttempts || data.correct_attempts || 0) : 0;
                        const acc = total > 0 ? Math.round((correct / total) * 100) : null;

                        let bg = 'var(--bg-secondary)';
                        let borderColor = 'var(--border-color)';
                        let textColor = 'var(--text-secondary)';

                        if (acc !== null) {
                            if (acc >= 90) {
                                bg = 'var(--accent-green-dim)';
                                borderColor = 'var(--accent-green)';
                                textColor = 'var(--accent-green)';
                            } else if (acc >= 70) {
                                bg = 'var(--accent-amber-dim)';
                                borderColor = 'var(--accent-amber)';
                                textColor = 'var(--accent-amber)';
                            } else {
                                bg = 'var(--accent-red-dim)';
                                borderColor = 'var(--accent-red)';
                                textColor = 'var(--accent-red)';
                            }
                        }

                        return `
                        <button class="char-heatmap-block" data-char="${ch}" style="background: ${bg}; border: 2px solid ${borderColor}; border-radius: var(--border-radius-sm); padding: 0.75rem 0.25rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.15s;">
                            <span style="font-size: 1.25rem; font-weight: 800; color: ${textColor}; line-height: 1;">${ch}</span>
                            <span style="font-size: 0.75rem; font-weight: 600; margin-top: 0.35rem; color: var(--text-primary);">
                                ${acc !== null ? `${acc}%` : '—'}
                            </span>
                        </button>
                        `;
                    }).join('')}
                </div>

                <!-- Selected Character Detail Popup / Banner -->
                <div id="stats-char-detail-banner" style="margin-top: 1.5rem; display: none;"></div>
            </div>
        </div>

        <div class="ma-grid ma-grid--2col" style="gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Weakest Characters Focus -->
            <div class="ma-card">
                <div class="ma-card__header" style="justify-content: space-between;">
                    <h2 class="ma-h3">🎯 Priority Weak Characters</h2>
                    ${topWeak.length > 0 ? `
                        <button id="stats-btn-practice-weak" class="ma-btn ma-btn--secondary ma-btn--sm">
                            Practice These
                        </button>
                    ` : ''}
                </div>
                <div class="ma-card__body">
                    ${topWeak.length === 0 ? `
                        <div class="ma-empty-state" style="padding: 2rem 1rem; text-align: center;">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌟</div>
                            <h4 class="ma-h4">No weak characters recorded!</h4>
                            <p class="ma-text ma-text--muted" style="margin-top: 0.25rem;">As you practice sessions, symbols that challenge you will appear here.</p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${topWeak.map(w => `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <span style="font-size: 1.35rem; font-weight: 800; color: var(--accent-cyan); width: 1.5rem; text-align: center;">${w.char}</span>
                                        <span style="font-family: monospace; letter-spacing: 2px; color: var(--text-secondary);">${w.morse}</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 1rem;">
                                        <span class="ma-text--muted" style="font-size: 0.85rem;">${w.correct}/${w.total} correct</span>
                                        <span class="ma-badge ${w.accuracy >= 70 ? 'ma-badge--warning' : 'ma-badge--danger'}" style="min-width: 48px; text-align: center;">
                                            ${w.accuracy}%
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>

            <!-- Streak & Dedication Summary -->
            <div class="ma-card">
                <div class="ma-card__header">
                    <h2 class="ma-h3">🔥 Practice Streak & Habit</h2>
                </div>
                <div class="ma-card__body" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem 1.5rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">
                        ${(stats.streak || 0) > 0 ? '🔥' : '⚡'}
                    </div>
                    <div style="font-size: 2.75rem; font-weight: 800; color: var(--accent-amber); line-height: 1.1;">
                        ${stats.streak || 0} ${(stats.streak === 1) ? 'Day' : 'Days'}
                    </div>
                    <div class="ma-stat-label" style="margin-top: 0.5rem; font-size: 1.05rem;">Current Practice Streak</div>
                    <p class="ma-text ma-text--muted" style="margin-top: 0.75rem; max-width: 320px; font-size: 0.9rem;">
                        Daily auditory exposure locks Morse rhythms permanently into muscle memory. Practice at least 5 minutes every day!
                    </p>
                </div>
            </div>
        </div>

        <!-- Practice History Table -->
        <div class="ma-card" style="margin-bottom: 2rem;">
            <div class="ma-card__header">
                <h2 class="ma-h3">🕒 Practice & Exam History (Last 20 Sessions)</h2>
            </div>
            <div class="ma-card__body" style="padding: 0; overflow-x: auto;">
                ${history.length === 0 ? `
                    <div class="ma-empty-state" style="padding: 2.5rem 1rem; text-align: center;">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📝</div>
                        <h4 class="ma-h4">No sessions recorded yet</h4>
                        <p class="ma-text ma-text--muted">Your completed quizzes and exams will be tracked here.</p>
                    </div>
                ` : `
                    <table class="ma-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Session Type</th>
                                <th>Speed (WPM)</th>
                                <th>Duration</th>
                                <th style="text-align: right;">Accuracy</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(h => {
                                const score = h.score !== undefined ? h.score : (h.accuracy !== undefined ? h.accuracy : '-');
                                const badgeClass = score >= 85 ? 'ma-badge--success' : (score >= 70 ? 'ma-badge--warning' : 'ma-badge--danger');
                                const dateStr = h.date || h.created_at;
                                const dateFormatted = dateStr ? new Date(dateStr).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

                                return `
                                <tr>
                                    <td class="ma-text--muted" style="font-size: 0.875rem;">${dateFormatted}</td>
                                    <td style="font-weight: 600; text-transform: capitalize;">${h.type || 'Practice'}</td>
                                    <td>${h.wpm ? `${h.wpm} WPM` : '—'}</td>
                                    <td>${h.duration ? `${h.duration}s` : '—'}</td>
                                    <td style="text-align: right;">
                                        <span class="ma-badge ${badgeClass}">${score}${typeof score === 'number' ? '%' : ''}</span>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        </div>

        <!-- Achievement Badges Card -->
        <div class="ma-card">
            <div class="ma-card__header" style="justify-content: space-between;">
                <div>
                    <h2 class="ma-h3">🏆 Operator Badges & Achievements</h2>
                    <p class="ma-text ma-text--muted">Unlock achievements as you improve speed, master new character sets, and maintain streaks.</p>
                </div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--accent-cyan);">
                    ${unlockedAchievements.size} / ${ALL_ACHIEVEMENTS.length} Unlocked
                </div>
            </div>

            <div class="ma-card__body">
                <div class="ma-grid ma-grid--4col" style="gap: 1.25rem;">
                    ${ALL_ACHIEVEMENTS.map(ach => {
                        const isUnlocked = unlockedAchievements.has(ach.key);

                        return `
                        <div class="ma-card" style="padding: 1.25rem; text-align: center; border: 1px solid ${isUnlocked ? 'var(--accent-cyan)' : 'var(--border-color)'}; background: ${isUnlocked ? 'var(--bg-card)' : 'var(--bg-secondary)'}; opacity: ${isUnlocked ? '1' : '0.55'};">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem; filter: ${isUnlocked ? 'none' : 'grayscale(100%)'};">
                                ${ach.icon}
                            </div>
                            <h4 class="ma-h4" style="color: ${isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'}; margin-bottom: 0.25rem;">
                                ${isUnlocked ? ach.name : '???'}
                            </h4>
                            <p class="ma-text ma-text--muted" style="font-size: 0.8rem;">
                                ${ach.desc}
                            </p>
                            <div style="margin-top: 0.75rem;">
                                <span class="ma-badge ${isUnlocked ? 'ma-badge--success' : 'ma-badge--ghost'}" style="font-size: 0.75rem;">
                                    ${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}
                                </span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>
    `;
}

function bindStatisticsEvents() {
    if (!containerRef) return;

    // Export button
    const exportBtn = containerRef.querySelector('#stats-btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                app: 'Morse Academy',
                exportDate: new Date().toISOString(),
                stats: window.AppState ? window.AppState.getStats() : {},
                progress: window.AppState ? window.AppState.getProgress() : {}
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `morse-statistics-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (window.Toast) window.Toast.success('Statistics downloaded');
        });
    }

    // Practice weak characters
    const weakBtn = containerRef.querySelector('#stats-btn-practice-weak');
    if (weakBtn) {
        weakBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/receiving');
        });
    }

    // Heatmap click detail
    const blocks = containerRef.querySelectorAll('.char-heatmap-block');
    const detailBanner = containerRef.querySelector('#stats-char-detail-banner');
    blocks.forEach(b => {
        b.addEventListener('click', () => {
            const ch = b.getAttribute('data-char');
            const stats = window.AppState ? window.AppState.getStats() : {};
            const data = stats.charPerformance ? stats.charPerformance[ch] : null;
            const engine = window.MorseEngine;

            if (detailBanner) {
                detailBanner.style.display = 'block';
                const total = data ? (data.totalAttempts || data.total_attempts || 0) : 0;
                const correct = data ? (data.correctAttempts || data.correct_attempts || 0) : 0;
                const acc = total > 0 ? Math.round((correct / total) * 100) : 'None';
                const morse = engine ? engine.charToMorse(ch) : '';
                const last = data?.lastPracticed ? new Date(data.lastPracticed).toLocaleDateString() : 'Never';

                detailBanner.innerHTML = `
                <div style="background: var(--bg-secondary); border: 1px solid var(--accent-cyan); border-radius: var(--border-radius); padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1.25rem;">
                        <span style="font-size: 2.5rem; font-weight: 800; color: var(--accent-cyan);">${ch}</span>
                        <div>
                            <div style="font-family: monospace; font-size: 1.2rem; letter-spacing: 2px;">${morse}</div>
                            <div class="ma-text--muted" style="font-size: 0.85rem;">Last Practiced: ${last}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1.5rem; align-items: center;">
                        <div style="text-align: right;">
                            <div class="ma-stat-value" style="font-size: 1.5rem;">${acc}%</div>
                            <div class="ma-stat-label">${correct} of ${total} attempts</div>
                        </div>
                        <button id="detail-audio-play" class="ma-btn ma-btn--secondary ma-btn--sm">
                            <span>🔊 Listen</span>
                        </button>
                    </div>
                </div>
                `;

                const listenBtn = detailBanner.querySelector('#detail-audio-play');
                if (listenBtn && window.MorseAudio) {
                    listenBtn.addEventListener('click', () => {
                        window.MorseAudio.init();
                        window.MorseAudio.playChar(ch);
                    });
                }
            }
        });
    });
}

export function render(container) {
    containerRef = container;
    container.innerHTML = renderStatisticsHTML();
    bindStatisticsEvents();
}

export function init() {
    // Loaded
}

export function destroy() {
    containerRef = null;
    selectedCharDetail = null;
}
