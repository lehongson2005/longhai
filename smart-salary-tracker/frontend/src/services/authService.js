import api from './api';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

export const register = async (name, email, password, employee_code) => {
    const response = await api.post('/auth/register', { name, email, password, employee_code });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
};
