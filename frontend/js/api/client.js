/**
 * CineMax API Client Helper Module
 */
export const API_BASE_URL = 'http://localhost:8080/api';

export function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function setToken(token, remember = false) {
    if (remember) {
        localStorage.setItem('token', token);
    } else {
        sessionStorage.setItem('token', token);
    }
}

export function removeToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
}

export async function fetchWithAuth(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            removeToken();
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMessage = (data && (data.message || data.error)) || `Lỗi yêu cầu: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}
