import axios from 'axios';
import { clearAllCache } from '../utils/fastCache';

const defaultBaseUrl = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = String(error?.config?.url || '');
        if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_user');
            clearAllCache();
        }
        return Promise.reject(error);
    }
);

export default api;
