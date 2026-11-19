// Morse Academy — Modal Dialog Component
// Alert, Confirm, and Custom Dialog Windows

class ModalManager {
    constructor() {
        this.container = null;
        this._currentResolve = null;
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }

    _getContainer() {
        if (!this.container) {
            this.container = document.getElementById('modal-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'modal-container';
                this.container.className = 'ma-modal-container';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }

    show({ title = '', content = '', buttons = [] }) {
        return new Promise((resolve) => {
            this.close();
            this._currentResolve = resolve;

            const container = this._getContainer();
            container.innerHTML = `
                <div class="ma-modal__backdrop"></div>
                <div class="ma-modal__dialog">
                    <div class="ma-modal__header">
                        <h3 class="ma-h3">${title}</h3>
                        <button class="ma-btn ma-btn--ghost ma-btn--sm modal-close-btn" aria-label="Close modal">&times;</button>
                    </div>
                    <div class="ma-modal__body">
                        ${content}
                    </div>
                    <div class="ma-modal__footer">
                        <!-- Buttons rendered here -->
                    </div>
                </div>
            `;

            const footer = container.querySelector('.ma-modal__footer');
            if (buttons.length === 0) {
                // Default OK button
                buttons = [{ label: 'OK', class: 'ma-btn--primary', action: () => resolve(true) }];
            }

            buttons.forEach(btnConfig => {
                const btn = document.createElement('button');
                btn.className = `ma-btn ${btnConfig.class || 'ma-btn--ghost'}`;
                btn.textContent = btnConfig.label || 'OK';
                btn.addEventListener('click', () => {
                    this.close();
                    if (btnConfig.action) {
                        resolve(btnConfig.action());
                    } else {
                        resolve(true);
                    }
                });
                footer.appendChild(btn);
            });

            // Close on backdrop or X button
            const backdrop = container.querySelector('.ma-modal__backdrop');
            const closeBtn = container.querySelector('.modal-close-btn');

            backdrop.addEventListener('click', () => this.close());
            closeBtn.addEventListener('click', () => this.close());

            window.addEventListener('keydown', this._handleKeyDown);
            container.classList.add('active');
        });
    }

    _handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }

    close() {
        if (this.container) {
            this.container.classList.remove('active');
            this.container.innerHTML = '';
        }
        window.removeEventListener('keydown', this._handleKeyDown);

        if (this._currentResolve) {
            this._currentResolve(null);
            this._currentResolve = null;
        }
    }

    alert(title, message) {
        return this.show({
            title,
            content: `<p class="ma-text">${message}</p>`,
            buttons: [
                { label: 'OK', class: 'ma-btn--primary', action: () => true }
            ]
        });
    }

    confirm(title, message) {
        return new Promise((resolve) => {
            this.show({
                title,
                content: `<p class="ma-text">${message}</p>`,
                buttons: [
                    { label: 'Cancel', class: 'ma-btn--ghost', action: () => resolve(false) },
                    { label: 'Confirm', class: 'ma-btn--primary', action: () => resolve(true) }
                ]
            });
        });
    }
}

export const Modal = new ModalManager();
if (typeof window !== 'undefined') {
    window.Modal = Modal;
}
