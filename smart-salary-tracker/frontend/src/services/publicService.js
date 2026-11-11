import api from './api';

export const getPublicJobs = async (filters = {}) => {
    const params = {};
    if (filters.location && filters.location !== 'all') params.location = filters.location;
    if (filters.site_type && filters.site_type !== 'all') params.site_type = filters.site_type;
    if (filters.department && filters.department !== 'all') params.department = filters.department;
    if (filters.q && filters.q.trim()) params.q = filters.q.trim();

    const response = await api.get('/public/jobs', { params });
    return response.data;
};

export const getPublicJobById = async (id) => {
    const response = await api.get(`/public/jobs/${id}`);
    return response.data;
};

export const submitApplication = async (payload) => {
    const response = await api.post('/public/applications', payload);
    return response.data;
};

export const submitQuoteRequest = async (payload) => {
    const response = await api.post('/public/quotes', payload);
    return response.data;
};

export const estimateSalary = async (payload) => {
    const response = await api.post('/public/salary-estimate', payload);
    return response.data;
};
