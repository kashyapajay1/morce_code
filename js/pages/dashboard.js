// Morse Academy — Dashboard Page
// Overview of learner progress, statistics, quick actions, and weak character focus

let unsubscribeState = null;
let containerRef = null;

function calculateAccuracy(stats) {
    if (!stats || !stats.history || stats.history.length === 0) {
        // Fallback to charPerformance if history is empty
        const charPerf = stats?.charPerformance || {};
        const chars = Object.values(charPerf);
        if (chars.length === 0) return 0;
        let totalAttempts = 0;
        let correctAttempts = 0;
        chars.forEach(c => {
            const tot = c.totalAttempts || c.total_attempts || 0;
            const cor = c.correctAttempts || c.correct_attempts || 0;
            totalAttempts += tot;
            correctAttempts += cor;
        });
        return totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    }

    const sessionsWithAcc = stats.history.filter(h => typeof h.accuracy === 'number' || typeof h.score === 'number');
    if (sessionsWithAcc.length === 0) return 0;
    const sum = sessionsWithAcc.reduce((acc, h) => acc + (h.accuracy !== undefined ? h.accuracy : h.score), 0);
    return Math.round(sum / sessionsWithAcc.length);
}

function getWeakestCharacters(stats, limit = 5) {
    const charPerf = stats?.charPerformance || {};
    const items = [];

    for (const [char, data] of Object.entries(charPerf)) {
        const total = data.totalAttempts || data.total_attempts || 0;
        const correct = data.correctAttempts || data.correct_attempts || 0;
        if (total > 0) {
            const acc = Math.round((correct / total) * 100);
            items.push({
                char,
                total,
                correct,
                accuracy: acc,
                morse: (window.MorseEngine ? window.MorseEngine.charToMorse(char) : '')
            });
        }
    }

    items.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
    return items.slice(0, limit);
}

function formatDate(dateStr) {
    if (!dateStr) return 'Recently';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Recently';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'Recently';
    }
}

function renderDashboardHTML() {
    const state = window.AppState;
    const progress = state ? state.getProgress() : { currentLevel: 1, completedLevels: [], scores: {} };
    const stats = state ? state.getStats() : { totalTime: 0, sessions: 0, history: [], charPerformance: {}, streak: 0 };
    const engine = window.MorseEngine;

    const currentLevelId = progress.currentLevel || 1;
    const currentLevel = engine ? engine.getLevel(currentLevelId) : { stage: 1, level: currentLevelId, title: `Level ${currentLevelId}`, chars: ['K', 'M'], desc: 'Koch lesson' };

    const unlockedChars = engine ? engine.getUnlockedChars(progress.completedLevels || []) : (currentLevel?.chars || ['K', 'M']);
    const charsLearnedCount = unlockedChars.length;
    const overallAccuracy = calculateAccuracy(stats);
    const streak = stats.streak || 0;

    const weakest = getWeakestCharacters(stats, 5);
    const recentHistory = (stats.history || []).slice(-5).reverse();

    // Progress percentage towards completing all 32 levels
    const totalLevels = (engine && engine.getCurriculum) ? engine.getCurriculum().length : 32;
    const completedCount = (progress.completedLevels || []).length;
    const overallProgressPct = Math.min(100, Math.round((completedCount / totalLevels) * 100));

    return `
    <div class="ma-page ma-fade-in">
        <!-- Page Header -->
        <header class="ma-page__header">
            <h1 class="ma-h1">Welcome to Morse Academy</h1>
            <p class="ma-text ma-text--muted">Master the language of dots and dashes, one character at a time.</p>
        </header>

        <!-- Stats Row -->
        <section class="ma-section" aria-label="Quick Statistics">
            <div class="ma-grid ma-grid--4col">
                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">Level ${currentLevelId}</div>
                        <div class="ma-stat-label">Current Level</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${charsLearnedCount}</div>
                        <div class="ma-stat-label">Characters Learned</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${overallAccuracy}%</div>
                        <div class="ma-stat-label">Overall Accuracy</div>
                    </div>
                </div>

                <div class="ma-card ma-stat-card">
                    <div class="ma-card__body">
                        <div class="ma-stat-value">${streak} ${streak > 0 ? '🔥' : '⚡'}</div>
                        <div class="ma-stat-label">${streak === 1 ? '1 Day Streak' : `${streak} Days Streak`}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Main Dashboard Content Grid -->
        <div class="ma-grid ma-grid--2col" style="margin-top: 1.5rem; gap: 1.5rem;">
            <!-- Left Column: Current Level Progress & Quick Actions -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Current Level Progress Card -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <div>
                            <span class="ma-badge ma-badge--info">Stage ${currentLevel?.stage || 1}</span>
                            <h2 class="ma-h3" style="margin-top: 0.25rem;">Level ${currentLevelId}: ${currentLevel?.title || 'Current Mission'}</h2>
                        </div>
                        <span class="ma-badge ${progress.completedLevels?.includes(currentLevelId) ? 'ma-badge--success' : 'ma-badge--warning'}">
                            ${progress.completedLevels?.includes(currentLevelId) ? 'Completed' : 'In Progress'}
                        </span>
                    </div>

                    <div class="ma-card__body">
                        <p class="ma-text" style="margin-bottom: 1rem;">${currentLevel?.desc || 'Progressive training module.'}</p>
                        
                        ${currentLevel?.chars && currentLevel.chars.length > 0 ? `
                            <div style="margin-bottom: 1.25rem;">
                                <label class="ma-label">Target Characters for this Level:</label>
                                <div class="ma-flex" style="gap: 0.75rem; flex-wrap: wrap;">
                                    ${currentLevel.chars.map(c => `
                                        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary); padding: 0.4rem 0.75rem; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                            <span style="font-weight: 700; color: var(--accent-cyan); font-size: 1.1rem;">${c}</span>
                                            <span style="font-family: monospace; letter-spacing: 2px; color: var(--text-primary); font-size: 1rem;">
                                                ${engine ? engine.charToMorse(c) : ''}
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.375rem;">
                                <span class="ma-label" style="margin-bottom:0;">Curriculum Completion</span>
                                <span class="ma-label" style="margin-bottom:0; font-weight: 600;">${overallProgressPct}% (${completedCount}/${totalLevels} levels)</span>
                            </div>
                            <div class="ma-progress">
                                <div class="ma-progress__bar ma-progress__bar--cyan" style="width: ${overallProgressPct}%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="ma-card__footer" style="justify-content: space-between;">
                        <span class="ma-text--muted" style="font-size: 0.875rem;">Master characters by sound rhythm</span>
                        <button id="dash-btn-continue" class="ma-btn ma-btn--primary">
                            <span>Continue Learning</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>

                <!-- Quick Actions Card -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h2 class="ma-h3">⚡ Quick Actions</h2>
                    </div>
                    <div class="ma-card__body">
                        <div class="ma-grid ma-grid--3col" style="gap: 0.75rem;">
                            <button id="dash-action-lesson" class="ma-btn ma-btn--primary" style="flex-direction: column; padding: 1.25rem 0.75rem; height: auto;">
                                <span style="font-size: 1.5rem; margin-bottom: 0.25rem;">🎓</span>
                                <span>Start Lesson</span>
                            </button>
                            <button id="dash-action-practice" class="ma-btn ma-btn--secondary" style="flex-direction: column; padding: 1.25rem 0.75rem; height: auto;">
                                <span style="font-size: 1.5rem; margin-bottom: 0.25rem;">🎧</span>
                                <span>Practice</span>
                            </button>
                            <button id="dash-action-exam" class="ma-btn ma-btn--ghost" style="flex-direction: column; padding: 1.25rem 0.75rem; height: auto; border: 1px solid var(--border-color);">
                                <span style="font-size: 1.5rem; margin-bottom: 0.25rem;">📝</span>
                                <span>Take Exam</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Weakest Characters & Recent Activity -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- Weakest Characters Card -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h2 class="ma-h3">🎯 Priority Practice (Weakest Characters)</h2>
                        ${weakest.length > 0 ? `
                            <button id="dash-btn-practice-weak" class="ma-btn ma-btn--sm ma-btn--secondary">
                                Practice These
                            </button>
                        ` : ''}
                    </div>

                    <div class="ma-card__body">
                        ${weakest.length === 0 ? `
                            <div class="ma-empty-state" style="padding: 2rem 1rem; text-align: center;">
                                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🌟</div>
                                <h3 class="ma-h4">No character bottlenecks detected!</h3>
                                <p class="ma-text ma-text--muted" style="margin-top: 0.25rem;">Complete lessons and quizzes to uncover characters that need extra attention.</p>
                            </div>
                        ` : `
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${weakest.map(item => `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.9rem; background: var(--bg-secondary); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                                            <span style="font-size: 1.25rem; font-weight: 700; width: 1.5rem; text-align: center; color: var(--accent-cyan);">${item.char}</span>
                                            <span style="font-family: monospace; letter-spacing: 2px; color: var(--text-secondary);">${item.morse}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 1rem;">
                                            <span class="ma-text--muted" style="font-size: 0.85rem;">${item.correct}/${item.total} correct</span>
                                            <span class="ma-badge ${item.accuracy >= 80 ? 'ma-badge--warning' : 'ma-badge--danger'}" style="min-width: 48px; text-align: center;">
                                                ${item.accuracy}%
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- Recent Activity Card -->
                <div class="ma-card">
                    <div class="ma-card__header">
                        <h2 class="ma-h3">🕒 Recent Activity</h2>
                        <button id="dash-btn-all-stats" class="ma-btn ma-btn--ghost ma-btn--sm">View All</button>
                    </div>

                    <div class="ma-card__body" style="padding: 0.75rem 1.25rem;">
                        ${recentHistory.length === 0 ? `
                            <div class="ma-empty-state" style="padding: 2rem 1rem; text-align: center;">
                                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📖</div>
                                <h3 class="ma-h4">No sessions recorded yet</h3>
                                <p class="ma-text ma-text--muted" style="margin-top: 0.25rem;">Start your first lesson in Morse Academy to see your history here.</p>
                            </div>
                        ` : `
                            <table class="ma-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Session Type</th>
                                        <th style="text-align: right;">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentHistory.map(h => {
                                        const score = h.score !== undefined ? h.score : (h.accuracy !== undefined ? h.accuracy : '-');
                                        const badgeClass = score >= 85 ? 'ma-badge--success' : (score >= 70 ? 'ma-badge--warning' : 'ma-badge--danger');
                                        return `
                                            <tr>
                                                <td class="ma-text--muted" style="font-size: 0.875rem;">${formatDate(h.date || h.created_at)}</td>
                                                <td style="font-weight: 500; text-transform: capitalize;">${h.type || 'Lesson'}</td>
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
            </div>
        </div>
    </div>
    `;
}

function bindDashboardEvents() {
    if (!containerRef) return;

    // Continue Learning button
    const continueBtn = containerRef.querySelector('#dash-btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/academy');
        });
    }

    // Quick Action buttons
    const lessonBtn = containerRef.querySelector('#dash-action-lesson');
    if (lessonBtn) {
        lessonBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/academy');
        });
    }

    const practiceBtn = containerRef.querySelector('#dash-action-practice');
    if (practiceBtn) {
        practiceBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/receiving');
        });
    }

    const examBtn = containerRef.querySelector('#dash-action-exam');
    if (examBtn) {
        examBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/exam');
        });
    }

    // Practice Weakest Characters button
    const weakBtn = containerRef.querySelector('#dash-btn-practice-weak');
    if (weakBtn) {
        weakBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/receiving');
        });
    }

    // View All Stats button
    const statsBtn = containerRef.querySelector('#dash-btn-all-stats');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            if (window.Router) window.Router.navigate('#/statistics');
        });
    }
}

export function render(container) {
    containerRef = container;
    container.innerHTML = renderDashboardHTML();
    bindDashboardEvents();
}

export function init() {
    // Subscribe to state changes to update dashboard live
    if (window.AppState && typeof window.AppState.subscribe === 'function') {
        const rerender = () => {
            if (containerRef) {
                render(containerRef);
            }
        };
        const unsub1 = window.AppState.subscribe('morseProgress', rerender);
        const unsub2 = window.AppState.subscribe('morseStats', rerender);
        unsubscribeState = () => {
            if (unsub1) unsub1();
            if (unsub2) unsub2();
        };
    }
}

export function destroy() {
    if (unsubscribeState) {
        try { unsubscribeState(); } catch {}
        unsubscribeState = null;
    }
    containerRef = null;
}
