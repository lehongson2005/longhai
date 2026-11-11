import api from './api';

export const getAdminStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getAdminJobs = async () => {
    const response = await api.get('/admin/jobs');
    return response.data;
};

export const createAdminJob = async (data) => {
    const response = await api.post('/admin/jobs', data);
    return response.data;
};

export const updateAdminJob = async (id, data) => {
    const response = await api.put(`/admin/jobs/${id}`, data);
    return response.data;
};

export const deleteAdminJob = async (id) => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
};

export const getAdminApplications = async (status = 'all') => {
    const params = status && status !== 'all' ? { status } : {};
    const response = await api.get('/admin/applications', { params });
    return response.data;
};

export const updateApplicationStatus = async (id, data) => {
    const response = await api.patch(`/admin/applications/${id}`, data);
    return response.data;
};

export const getAdminQuotes = async (status = 'all') => {
    const params = status && status !== 'all' ? { status } : {};
    const response = await api.get('/admin/quotes', { params });
    return response.data;
};

export const updateQuoteStatus = async (id, data) => {
    const response = await api.patch(`/admin/quotes/${id}`, data);
    return response.data;
};
