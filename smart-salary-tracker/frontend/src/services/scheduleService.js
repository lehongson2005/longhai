import api from './api';
import { readCache, writeCache, invalidateCachePrefix } from '../utils/fastCache';

function scheduleKey(month, year) {
    return `schedules:${year}-${String(month).padStart(2, '0')}`;
}

export const getCachedSchedules = (month, year) => {
    return readCache(scheduleKey(month, year));
};

export const getSchedules = async (month, year) => {
    const response = await api.get(`/schedules?month=${month}&year=${year}`);
    writeCache(scheduleKey(month, year), response.data);
    return response.data;
};

export const saveSchedule = async (data) => {
    const response = await api.post('/schedules', data);
    invalidateCachePrefix('schedules:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};

export const bulkSaveSchedule = async (data) => {
    const response = await api.post('/schedules/bulk', data);
    invalidateCachePrefix('schedules:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};

export const deleteSchedule = async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    invalidateCachePrefix('schedules:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};
