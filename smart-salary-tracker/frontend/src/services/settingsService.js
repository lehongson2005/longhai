import api from './api';
import { readCache, writeCache, invalidateCachePrefix } from '../utils/fastCache';

export const getCachedSettings = () => readCache('salary_settings');

export const getSettings = async () => {
    const response = await api.get('/settings');
    writeCache('salary_settings', response.data);
    return response.data;
};

export const updateSettings = async (data) => {
    const response = await api.put('/settings', data);
    writeCache('salary_settings', response.data?.settings || data);
    invalidateCachePrefix('schedules:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};
