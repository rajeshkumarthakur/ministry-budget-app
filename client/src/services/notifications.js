// src/services/notifications.js
import api from './api';

export const notificationsService = {
  // Get all notifications for current user
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  // Mark a notification as read
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};

export default notificationsService;

