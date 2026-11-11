import api from './api';
import { format } from 'date-fns';

export const getDashboardData = async (date = new Date()) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const response = await api.get(`/dashboard?date=${dateString}`);
    return response.data;
};
