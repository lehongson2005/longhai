import api from './api';
import { clearAllCache } from '../utils/fastCache';

const USER_CACHE_KEY = 'auth_user';

export const getCachedUser = () => {
    try {
        if (!localStorage.getItem('token')) return null;
        const raw = localStorage.getItem(USER_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

function persistSession(data) {
    if (data?.token) {
        localStorage.setItem('token', data.token);
    }
    if (data?.user) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    }
}

export const login = async (identifier, password) => {
    clearAllCache();
    const response = await api.post('/auth/login', { identifier, password });
    persistSession(response.data);
    return response.data;
};

export const register = async ({ name, identifier, password, employee_code }) => {
    clearAllCache();
    const response = await api.post('/auth/register', { name, identifier, password, employee_code });
    persistSession(response.data);
    return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    if (response.data) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem(USER_CACHE_KEY);
    clearAllCache();
};
