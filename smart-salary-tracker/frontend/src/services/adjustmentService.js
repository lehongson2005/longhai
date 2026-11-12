import api from './api';
import { invalidateCachePrefix } from '../utils/fastCache';

export const getAdjustments = async (month, year) => {
    const response = await api.get(`/adjustments?month=${month}&year=${year}`);
    return response.data;
};

export const createAdjustment = async (data) => {
    const response = await api.post('/adjustments', data);
    invalidateCachePrefix('dashboard:');
    return response.data;
};

export const deleteAdjustment = async (id) => {
    const response = await api.delete(`/adjustments/${id}`);
    invalidateCachePrefix('dashboard:');
    return response.data;
};
