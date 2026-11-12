import api from './api';
import { format } from 'date-fns';

export const getDashboardData = async (todayDate = new Date(), monthDate = todayDate) => {
    const dateString = format(todayDate, 'yyyy-MM-dd');
    const month = format(monthDate, 'MM');
    const year = format(monthDate, 'yyyy');
    const response = await api.get(`/dashboard?date=${dateString}&month=${month}&year=${year}`);
    return response.data;
};
