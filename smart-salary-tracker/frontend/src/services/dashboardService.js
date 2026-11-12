import api from './api';
import { format } from 'date-fns';
import { readCache, writeCache } from '../utils/fastCache';

function dashboardKey(monthDate) {
    return `dashboard:${format(monthDate, 'yyyy-MM')}`;
}

export const getCachedDashboard = (monthDate = new Date()) => {
    return readCache(dashboardKey(monthDate));
};

export const getDashboardData = async (todayDate = new Date(), monthDate = todayDate) => {
    const dateString = format(todayDate, 'yyyy-MM-dd');
    const month = format(monthDate, 'MM');
    const year = format(monthDate, 'yyyy');
    const response = await api.get(`/dashboard?date=${dateString}&month=${month}&year=${year}`);
    writeCache(dashboardKey(monthDate), response.data);
    return response.data;
};
