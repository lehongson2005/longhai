import api from './api';
import { readCache, writeCache, invalidateCachePrefix } from '../utils/fastCache';

function expenseKey(month, year) {
    return `expenses:${year}-${String(month).padStart(2, '0')}`;
}

export const getCachedExpenses = (month, year) => readCache(expenseKey(month, year));
export const getCachedCategories = () => readCache('expense_categories');

export const getExpenses = async (month, year) => {
    const response = await api.get(`/expenses?month=${month}&year=${year}`);
    writeCache(expenseKey(month, year), response.data);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/expenses/categories');
    writeCache('expense_categories', response.data);
    return response.data;
};

export const createExpense = async (data) => {
    const response = await api.post('/expenses', data);
    invalidateCachePrefix('expenses:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};

export const updateExpense = async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    invalidateCachePrefix('expenses:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    invalidateCachePrefix('expenses:');
    invalidateCachePrefix('dashboard:');
    return response.data;
};
