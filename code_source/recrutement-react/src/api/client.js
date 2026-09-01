const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

let redirectingToLogin = false;

export function backendPath(path) {
    return backendUrl ? `${backendUrl}${path}` : path;
}

export function redirectToLogin() {
    const loginUrl = backendPath('/login');

    if (redirectingToLogin || window.location.href === loginUrl) {
        return;
    }

    redirectingToLogin = true;
    window.location.href = loginUrl;
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

    const response = await getJson('/api/csrf-token');
    csrfToken = response?.data?.token ?? '';

    return csrfToken;
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
        throw new Error(payload.message ?? `Erreur HTTP ${response.status}`);
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
        await sendJson('/logout', { method: 'POST' });
    } finally {
        redirectingToLogin = false;
        redirectToLogin();
    }
}
