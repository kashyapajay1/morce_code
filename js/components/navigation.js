// Morse Academy — Navigation Component
// Builds sidebar navigation, mobile drawer toggle, and mobile bottom bar

export const NAV_ITEMS = [
    { id: 'dashboard',      label: 'Dashboard',          icon: '📊', route: '#/dashboard' },
    { id: 'academy',        label: 'Morse Academy',      icon: '🎓', route: '#/academy' },
    { id: 'translator',     label: 'Translator',         icon: '🔄', route: '#/translator' },
    { id: 'sending',        label: 'Sending Practice',   icon: '📡', route: '#/sending' },
    { id: 'receiving',      label: 'Receiving Practice',  icon: '🎧', route: '#/receiving' },
    { id: 'speed-training', label: 'Speed Training',     icon: '⚡', route: '#/speed-training' },
    { id: 'exam',           label: 'Exam Centre',        icon: '📝', route: '#/exam' },
    { id: 'cw-simulator',   label: 'CW Simulator',       icon: '📻', route: '#/cw-simulator' },
    { id: 'games',          label: 'Games & Challenges',  icon: '🎮', route: '#/games' },
    { id: 'statistics',     label: 'Statistics',          icon: '📈', route: '#/statistics' },
    { id: 'reference',      label: 'Reference',           icon: '📖', route: '#/reference' },
    { id: 'settings',       label: 'Settings',            icon: '⚙️', route: '#/settings' },
];

export const MOBILE_NAV_ITEMS = [
    { id: 'dashboard',  label: 'Dashboard',  icon: '📊', route: '#/dashboard' },
    { id: 'academy',    label: 'Academy',    icon: '🎓', route: '#/academy' },
    { id: 'translator', label: 'Translator', icon: '🔄', route: '#/translator' },
    { id: 'sending',    label: 'Practice',   icon: '📡', route: '#/sending' },
    { id: 'settings',   label: 'Settings',   icon: '⚙️', route: '#/settings' }
];

export function initNavigation(sidebarEl) {
    const navContainer = sidebarEl ? sidebarEl.querySelector('.ma-sidebar__nav') : null;
    const bottomNavEl = document.getElementById('bottom-nav');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    // Render Sidebar Items
    if (navContainer) {
        navContainer.innerHTML = NAV_ITEMS.map(item => `
            <a href="${item.route}" class="ma-sidebar__link" data-route="${item.route}">
                <span class="ma-sidebar__link-icon">${item.icon}</span>
                <span class="ma-sidebar__link-label">${item.label}</span>
            </a>
        `).join('');
    }

    // Render Bottom Nav Items
    if (bottomNavEl) {
        bottomNavEl.innerHTML = MOBILE_NAV_ITEMS.map(item => `
            <a href="${item.route}" class="ma-bottom-nav__item" data-route="${item.route}">
                <span class="ma-bottom-nav__icon">${item.icon}</span>
                <span class="ma-bottom-nav__label">${item.label}</span>
            </a>
        `).join('');
    }

    // Update active highlighting
    function updateActiveRoute() {
        const currentHash = window.location.hash || '#/dashboard';

        // Update sidebar links
        if (sidebarEl) {
            const links = sidebarEl.querySelectorAll('.ma-sidebar__link');
            links.forEach(link => {
                const route = link.getAttribute('data-route');
                if (route === currentHash || (currentHash === '' && route === '#/dashboard')) {
                    link.classList.add('ma-sidebar__link--active');
                } else {
                    link.classList.remove('ma-sidebar__link--active');
                }
            });
        }

        // Update mobile bottom nav links
        if (bottomNavEl) {
            const bottomLinks = bottomNavEl.querySelectorAll('.ma-bottom-nav__item');
            bottomLinks.forEach(link => {
                const route = link.getAttribute('data-route');
                if (route === currentHash || (currentHash === '' && route === '#/dashboard')) {
                    link.classList.add('ma-bottom-nav__item--active');
                } else {
                    link.classList.remove('ma-bottom-nav__item--active');
                }
            });
        }
    }

    // Mobile Drawer Toggle
    function toggleDrawer(open) {
        if (!sidebarEl) return;
        const isOpen = open !== undefined ? open : !sidebarEl.classList.contains('open');
        sidebarEl.classList.toggle('open', isOpen);
        if (overlay) {
            overlay.classList.toggle('active', isOpen);
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDrawer();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            toggleDrawer(false);
        });
    }

    // Close mobile drawer on route link click
    if (sidebarEl) {
        sidebarEl.addEventListener('click', (e) => {
            const link = e.target.closest('.ma-sidebar__link');
            if (link && window.innerWidth <= 1024) {
                toggleDrawer(false);
            }
        });
    }

    window.addEventListener('hashchange', updateActiveRoute);
    updateActiveRoute();
}
