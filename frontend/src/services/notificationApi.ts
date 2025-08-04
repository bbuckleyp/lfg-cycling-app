import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sendAt: string | null;
  sentAt: string | null;
  event: {
    id: number;
    title: string;
    startDate: string;
    startTime: string;
    startLocation: string;
    organizer: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

export const notificationApi = {
  async getNotifications(limit = 50, offset = 0) {
    const response = await api.get('/notifications', {
      params: { limit, offset },
    });
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async markAsRead(notificationId: number) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};