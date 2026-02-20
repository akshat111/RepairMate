import api from './api';

const getAllItems = (params = {}) => api.get('/inventory', { params });

const getItem = (id) => api.get(`/inventory/${id}`);

const createItem = (data) => api.post('/inventory', data);

const updateItem = (id, data) => api.patch(`/inventory/${id}`, data);

const deleteItem = (id) => api.delete(`/inventory/${id}`);

export default {
    getAllItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
};
