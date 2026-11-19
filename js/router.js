// Morse Academy — SPA Hash Router
// Dynamically imports and mounts page modules according to window.location.hash

const ROUTES = {
    '#/dashboard': './pages/dashboard.js',
    '#/academy': './pages/academy.js',
    '#/translator': './pages/translator.js',
    '#/sending': './pages/sending.js',
    '#/receiving': './pages/receiving.js',
    '#/speed-training': './pages/speed-training.js',
    '#/exam': './pages/exam.js',
    '#/cw-simulator': './pages/cw-simulator.js',
    '#/games': './pages/games.js',
    '#/statistics': './pages/statistics.js',
    '#/reference': './pages/reference.js',
    '#/settings': './pages/settings.js'
};

class RouterManager {
    constructor() {
        this.currentPageModule = null;
        this.container = null;
        this._init = false;
    }

    _getContainer() {
        if (!this.container) {
            this.container = document.getElementById('page-content');
        }
        return this.container;
    }

    init() {
        if (this._init) return;
        this._init = true;

        window.addEventListener('hashchange', () => this.handleRoute());

        // Default to #/dashboard if hash empty
        if (!window.location.hash) {
            window.location.hash = '#/dashboard';
        } else {
            this.handleRoute();
        }
    }

    navigate(hash) {
        if (window.location.hash === hash) {
            this.handleRoute();
        } else {
            window.location.hash = hash;
        }
    }

    current() {
        return window.location.hash || '#/dashboard';
    }

    async handleRoute() {
        const hash = window.location.hash || '#/dashboard';
        const pagePath = ROUTES[hash];

        if (!pagePath) {
            console.warn(`Route "${hash}" not recognized. Redirecting to #/dashboard`);
            window.location.hash = '#/dashboard';
            return;
        }

        const container = this._getContainer();
        if (!container) return;

        // Destroy current page lifecycle
        if (this.currentPageModule && typeof this.currentPageModule.destroy === 'function') {
            try {
                this.currentPageModule.destroy();
            } catch (err) {
                console.error('Error during page destroy:', err);
            }
        }
        this.currentPageModule = null;

        // Show loading spinner
        container.innerHTML = `
            <div class="loading-overlay">
                <div class="ma-spinner ma-spinner--lg"></div>
            </div>
        `;

        try {
            const pageModule = await import(pagePath);
            this.currentPageModule = pageModule;

            // Render and Init
            if (typeof pageModule.render === 'function') {
                pageModule.render(container);
            }
            if (typeof pageModule.init === 'function') {
                pageModule.init();
            }
        } catch (err) {
            console.warn(`Could not load page module ${pagePath}:`, err);

            // Resilient fallback placeholder
            const pageName = hash.replace('#/', '').replace('-', ' ').toUpperCase();
            container.innerHTML = `
                <div class="ma-page ma-fade-in">
                    <div class="ma-page__header">
                        <h1 class="ma-h1">${pageName}</h1>
                        <p class="ma-text ma-mt-1">Module loading or under construction.</p>
                    </div>
                    <div class="ma-card">
                        <div class="ma-card__body">
                            <p class="ma-text">Welcome to ${pageName}. This section is being loaded.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

export const Router = new RouterManager();
if (typeof window !== 'undefined') {
    window.Router = Router;
}
