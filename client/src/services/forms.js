// src/services/forms.js
import api from './api';

export const formsService = {
  // Forms
  async getForms() {
    const response = await api.get('/forms');
    return response.data;
  },

  async getForm(id) {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  async createForm(data) {
    const response = await api.post('/forms', data);
    return response.data;
  },

  async updateForm(id, data) {
    const response = await api.put(`/forms/${id}`, data);
    return response.data;
  },

  async updateFormSection(id, section, data) {
    const response = await api.put(`/forms/${id}`, { section, data });
    return response.data;
  },

  async deleteForm(id) {
    const response = await api.delete(`/forms/${id}`);
    return response.data;
  },

  async submitForm(id) {
    const response = await api.post(`/forms/${id}/submit`);
    return response.data;
  },

  async approveForm(id, action, comments, signature) {
    const response = await api.post(`/forms/${id}/approve`, {
      action,
      comments,
      signature,
    });
    return response.data;
  },

  // Events
  async getEvents(formId) {
    const response = await api.get(`/forms/${formId}/events`);
    return response.data;
  },

  async addEvent(formId, eventData) {
    const response = await api.post(`/forms/${formId}/events`, eventData);
    return response.data;
  },

  async createEvent(formId, eventData) {
    // Alias for addEvent for consistency
    return this.addEvent(formId, eventData);
  },

  async updateEvent(formId, eventId, eventData) {
    const response = await api.put(`/forms/${formId}/events/${eventId}`, eventData);
    return response.data;
  },

  async deleteEvent(formId, eventId) {
    const response = await api.delete(`/forms/${formId}/events/${eventId}`);
    return response.data;
  },

  // Goals
  async getGoals(formId) {
    const response = await api.get(`/forms/${formId}/goals`);
    return response.data;
  },

  async addGoal(formId, goalData) {
    const response = await api.post(`/forms/${formId}/goals`, goalData);
    return response.data;
  },

  async createGoal(formId, goalData) {
    // Alias for addGoal for consistency
    return this.addGoal(formId, goalData);
  },

  async updateGoal(formId, goalId, goalData) {
    const response = await api.put(`/forms/${formId}/goals/${goalId}`, goalData);
    return response.data;
  },

  async deleteGoal(formId, goalId) {
    const response = await api.delete(`/forms/${formId}/goals/${goalId}`);
    return response.data;
  },

  // Dashboard
  async getDashboardStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

// LOV (List of Values) Service
export const lovService = {
  async getMinistries() {
    const response = await api.get('/lov/ministries');
    return response.data;
  },

  async getEventTypes() {
    const response = await api.get('/lov/event-types');
    return response.data;
  },

  async getRoles() {
    const response = await api.get('/lov/roles');
    return response.data;
  },

  async getStatuses() {
    const response = await api.get('/lov/statuses');
    return response.data;
  },

  async getMyMinistry() {
    const response = await api.get('/lov/my-ministry');
    return response.data;
  },
};

// Admin Service
export const adminService = {
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

  // Pillars
  async getPillars() {
    const response = await api.get('/admin/pillars');
    return response.data;
  },

  // Users
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async createUser(data) {
    const response = await api.post('/users', data);
    return response.data;
  },
};

export default formsService;
