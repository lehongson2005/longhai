import api from './api';

export const getSchedules = async (month, year) => {
    const response = await api.get(`/schedules?month=${month}&year=${year}`);
    return response.data;
};

export const saveSchedule = async (data) => {
    const response = await api.post('/schedules', data);
    return response.data;
};

export const deleteSchedule = async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
};
