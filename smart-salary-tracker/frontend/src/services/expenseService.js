import api from './api';

export const getExpenses = async (month, year) => {
    const response = await api.get(`/expenses?month=${month}&year=${year}`);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/expenses/categories');
    return response.data;
};

export const createExpense = async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};
