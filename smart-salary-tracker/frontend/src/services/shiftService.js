import api from './api';
import { readCache, writeCache } from '../utils/fastCache';

export const getCachedShifts = () => readCache('shifts_list');

export const getShifts = async () => {
    const response = await api.get('/shifts');
    writeCache('shifts_list', response.data);
    return response.data;
};
