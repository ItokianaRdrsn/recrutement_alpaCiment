const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'alpa_ciment_auth_token';

let redirectingToLogin = false;

export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
    if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }
}

export function clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(extraHeaders = {}) {
    const token = getAuthToken();
    return {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
    };
}

export function backendPath(path) {
    return backendUrl ? `${backendUrl}${path}` : path;
}

export function redirectToLogin() {
    clearAuthToken();
    if (redirectingToLogin || window.location.pathname === '/login') {
        return;
    }

    redirectingToLogin = true;
    window.location.href = '/login';
}

export async function getPublicJson(url) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const response = await fetch(fullUrl, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

export async function sendPublicFormData(url, formData, method = 'POST') {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const response = await fetch(fullUrl, {
        method,
        headers: {
            Accept: 'application/json',
        },
        body: formData,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? `Erreur HTTP ${response.status}`;
        if (payload.errors) {
            const errList = Object.values(payload.errors).flat().join(' | ');
            msg += ` (${errList})`;
        }
        throw new Error(msg);
    }

    return payload;
}

const inFlightRequests = new Map();
const staticDataCache = new Map();

export function invalidateCache(prefix = null) {
    if (!prefix) {
        staticDataCache.clear();
        return;
    }
    for (const key of staticDataCache.keys()) {
        if (key.includes(prefix)) {
            staticDataCache.delete(key);
        }
    }
}

export async function getCachedJson(url, ttlMs = 300000) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const now = Date.now();
    const entry = staticDataCache.get(fullUrl);
    if (entry && now - entry.timestamp < ttlMs) {
        return entry.data;
    }
    const data = await getJson(url);
    if (data) {
        staticDataCache.set(fullUrl, { timestamp: now, data });
    }
    return data;
}

export async function getJson(url) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);

    // Déduplication des requêtes GET simultanées en vol (résout le double appel de React StrictMode)
    if (inFlightRequests.has(fullUrl)) {
        return inFlightRequests.get(fullUrl);
    }

    const requestPromise = (async () => {
        try {
            const response = await fetch(fullUrl, {
                headers: authHeaders(),
            });

            if (response.status === 401) {
                redirectToLogin();
                return null;
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            return await response.json();
        } finally {
            inFlightRequests.delete(fullUrl);
        }
    })();

    inFlightRequests.set(fullUrl, requestPromise);
    return requestPromise;
}

export async function submitLogin({ email, password, remember = false }) {
    const fullUrl = backendPath('/api/login');
    const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, remember }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? 'Identifiants incorrects';
        if (payload.errors?.email) {
            msg = payload.errors.email[0];
        } else if (payload.errors?.password) {
            msg = payload.errors.password[0];
        }
        throw new Error(msg);
    }

    if (payload?.data?.token) {
        setAuthToken(payload.data.token);
    }

    redirectingToLogin = false;
    return payload.data;
}

export async function sendJson(url, { body, method = 'POST' } = {}) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const headers = authHeaders({
        'Content-Type': 'application/json',
    });

    const response = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? `Erreur HTTP ${response.status}`;
        if (payload.errors) {
            const errList = Object.values(payload.errors).flat().join(' | ');
            msg = `${msg}: ${errList}`;
        }
        throw new Error(msg);
    }

    return payload;
}

export async function sendFormData(url, formData, method = 'POST') {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const headers = authHeaders();

    const response = await fetch(fullUrl, {
        method,
        headers,
        body: formData,
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        let msg = payload.message ?? `Erreur HTTP ${response.status}`;
        if (payload.errors) {
            const errList = Object.values(payload.errors).flat().join(' | ');
            msg += ` (${errList})`;
        }
        throw new Error(msg);
    }

    return payload;
}

export async function submitLogout() {
    try {
        await sendJson('/api/logout', { method: 'POST' });
    } catch {
        // Ignore logout errors
    } finally {
        clearAuthToken();
        redirectingToLogin = false;
        window.location.href = '/login';
    }
}
