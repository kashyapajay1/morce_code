// Morse Academy — Progress Bar Component
// Reusable HTML progress indicator generator

export function createProgressBar({
    value = 0,
    max = 100,
    color = 'cyan', // 'cyan' | 'amber' | 'green'
    label = '',
    showPercent = true
} = {}) {
    const safeMax = Math.max(1, max);
    const safeVal = Math.max(0, Math.min(safeMax, value));
    const percent = Math.round((safeVal / safeMax) * 100);

    const colorClass = `ma-progress__bar--${color}`;

    return `
        <div class="ma-progress-wrapper" style="width: 100%;">
            ${(label || showPercent) ? `
                <div class="ma-flex ma-justify-between ma-mb-1" style="font-size: 0.8125rem;">
                    ${label ? `<span class="ma-text--muted">${label}</span>` : '<span></span>'}
                    ${showPercent ? `<span class="ma-text--muted ma-text--bold">${percent}%</span>` : ''}
                </div>
            ` : ''}
            <div class="ma-progress">
                <div class="ma-progress__bar ${colorClass}" style="width: ${percent}%;"></div>
            </div>
        </div>
    `;
}
