import api from './api';
import { readCache, writeCache, invalidateCachePrefix } from '../utils/fastCache';

export const getCachedShifts = () => readCache('shifts_list');

export const getShifts = async () => {
    const response = await api.get('/shifts');
    writeCache('shifts_list', response.data);
    return response.data;
};

export const createShift = async (data) => {
    const response = await api.post('/shifts', data);
    invalidateCachePrefix('shifts_list');
    return response.data;
};

export const deleteShift = async (id) => {
    const response = await api.delete(`/shifts/${id}`);
    invalidateCachePrefix('shifts_list');
    return response.data;
};
