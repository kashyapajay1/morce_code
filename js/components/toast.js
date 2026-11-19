// Morse Academy — Toast Notification Component
// Stacking, auto-dismissing notifications

const ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
};

class ToastManager {
    constructor() {
        this.container = null;
    }

    _getContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'ma-toast-container';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }

    show(message, type = 'info', durationMs = 3000) {
        const container = this._getContainer();
        const toast = document.createElement('div');
        toast.className = `ma-toast ma-toast--${type}`;

        const icon = ICONS[type] || 'ℹ';

        toast.innerHTML = `
            <span class="ma-toast__icon">${icon}</span>
            <span class="ma-toast__message">${message}</span>
            <button class="ma-toast__close" aria-label="Close notification">&times;</button>
        `;

        const closeBtn = toast.querySelector('.ma-toast__close');
        let dismissTimer = null;

        const dismiss = () => {
            if (dismissTimer) clearTimeout(dismissTimer);
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', dismiss);

        if (durationMs > 0) {
            dismissTimer = setTimeout(dismiss, durationMs);
        }

        container.appendChild(toast);
        return toast;
    }

    success(message, durationMs = 3000) {
        return this.show(message, 'success', durationMs);
    }

    error(message, durationMs = 4000) {
        return this.show(message, 'error', durationMs);
    }

    warning(message, durationMs = 3500) {
        return this.show(message, 'warning', durationMs);
    }

    info(message, durationMs = 3000) {
        return this.show(message, 'info', durationMs);
    }
}

export const Toast = new ToastManager();
if (typeof window !== 'undefined') {
    window.Toast = Toast;
}
