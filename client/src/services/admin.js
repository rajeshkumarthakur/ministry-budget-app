// src/services/admin.js
import api from './api';

export const adminService = {
  // Statistics
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Ministries
  async getMinistries() {
    const response = await api.get('/admin/ministries');
    return response.data;
  },

  async createMinistry(data) {
    const response = await api.post('/admin/ministries', data);
    return response.data;
  },

  async updateMinistry(id, data) {
    const response = await api.put(`/admin/ministries/${id}`, data);
    return response.data;
  },

  async deleteMinistry(id) {
    const response = await api.delete(`/admin/ministries/${id}`);
    return response.data;
  },

  // Event Types
  async getEventTypes() {
    const response = await api.get('/admin/event-types');
    return response.data;
  },

  async createEventType(data) {
    const response = await api.post('/admin/event-types', data);
    return response.data;
  },

  async updateEventType(id, data) {
    const response = await api.put(`/admin/event-types/${id}`, data);
    return response.data;
  },

  async deleteEventType(id) {
    const response = await api.delete(`/admin/event-types/${id}`);
    return response.data;
  },

  // Users
  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async createUser(data) {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  async updateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async updateUserPIN(id, data) {
    const response = await api.put(`/admin/users/${id}/pin`, data);
    return response.data;
  },

  // Pillars (for dropdown in ministries)
  async getPillars() {
    const response = await api.get('/admin/pillars');
    return response.data;
  }
};
