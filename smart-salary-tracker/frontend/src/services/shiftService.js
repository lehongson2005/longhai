import api from './api';

export const getShifts = async () => {
    const response = await api.get('/shifts');
    return response.data;
};
