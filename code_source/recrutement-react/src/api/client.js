const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

let redirectingToLogin = false;

export function backendPath(path) {
    return backendUrl ? `${backendUrl}${path}` : path;
}

export function redirectToLogin() {
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

export async function getJson(url) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const response = await fetch(fullUrl, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
        },
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

let csrfToken = null;

export async function getCsrfToken() {
    if (csrfToken) {
        return csrfToken;
    }

    try {
        const fullUrl = backendPath('/api/csrf-token');
        const response = await fetch(fullUrl, {
            credentials: 'include',
            headers: {
                Accept: 'application/json',
            },
        });
        if (response.ok) {
            const data = await response.json();
            csrfToken = data?.data?.token ?? '';
        }
    } catch {
        csrfToken = '';
    }

    return csrfToken;
}

export async function submitLogin({ email, password, remember = false }) {
    const fullUrl = backendPath('/api/login');
    const token = await getCsrfToken();
    const response = await fetch(fullUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
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

    redirectingToLogin = false;
    return payload.data;
}

export async function sendJson(url, { body, method = 'POST' } = {}) {
    const fullUrl = url.startsWith('http') ? url : backendPath(url);
    const token = await getCsrfToken();
    const response = await fetch(fullUrl, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
        },
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
    const token = await getCsrfToken();
    const response = await fetch(fullUrl, {
        method,
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': token,
        },
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
        csrfToken = null;
        redirectingToLogin = false;
        window.location.href = '/login';
    }
}
