import api from './api';

export const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const register = async ({ name, identifier, password, employee_code }) => {
    const response = await api.post('/auth/register', { name, identifier, password, employee_code });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
};
