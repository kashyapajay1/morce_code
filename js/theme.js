// Morse Academy — Theme Manager Module
// Toggles and persists dark/light theme state

export const ThemeManager = {
    init() {
        const settings = window.AppState ? window.AppState.getSettings() : { theme: 'dark' };
        const theme = settings.theme || 'dark';
        this.apply(theme);

        // Bind theme toggle button in sidebar if present
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    },

    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0e17' : '#f8fafc');
        }

        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.theme-icon');
            const label = toggleBtn.querySelector('.theme-label');
            if (icon && label) {
                if (theme === 'dark') {
                    icon.textContent = '🌙';
                    label.textContent = 'Dark Mode';
                } else {
                    icon.textContent = '☀️';
                    label.textContent = 'Light Mode';
                }
            }
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.apply(next);

        if (window.AppState) {
            window.AppState.setSettings({ theme: next });
        }

        return next;
    },

    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
};

if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
}
