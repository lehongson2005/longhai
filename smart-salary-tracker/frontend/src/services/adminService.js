import api from './api';

export const getAdminStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getTeamPayroll = async (month, year) => {
    const response = await api.get('/admin/team-payroll', { params: { month, year } });
    return response.data;
};

export const getAdminUsers = async (q = '') => {
    const params = q && q.trim() ? { q: q.trim() } : {};
    const response = await api.get('/admin/users', { params });
    return response.data;
};

export const createAdminUser = async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
};

export const resetUserPassword = async (id, newPassword = '123456') => {
    const response = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
};

export const updateAdminUser = async (id, data) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
};

export const deleteAdminUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
};

export const exportAdminBackup = async () => {
    const response = await api.get('/admin/backup');
    return response.data;
};

export const importAdminBackup = async (backupPayload) => {
    const response = await api.post('/admin/restore', backupPayload);
    return response.data;
};
