// Morse Academy — API Client Module
// Wrapper around Fetch API for /api/v1 endpoints

const BASE_URL = '/api/v1';

class ApiClient {
    constructor() {
        this.baseUrl = BASE_URL;
    }

    _getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = window.AppState ? window.AppState.get('authToken') : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this._getHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                return {
                    success: false,
                    data: null,
                    error: (data && data.error) ? data.error : `HTTP Error ${response.status}`
                };
            }

            return data || { success: true, data: null, error: null };
        } catch (err) {
            console.warn(`MorseAPI network error for ${url}:`, err);
            return {
                success: false,
                data: null,
                error: 'Network error'
            };
        }
    }

    get(endpoint) {
        return this._request(endpoint, { method: 'GET' });
    }

    post(endpoint, data = {}) {
        return this._request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data = {}) {
        return this._request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this._request(endpoint, { method: 'DELETE' });
    }
}

export const MorseAPI = new ApiClient();
if (typeof window !== 'undefined') {
    window.MorseAPI = MorseAPI;
}
