import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import type { CreateCommentRequest, UpdateCommentRequest } from '../types/comment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post('/auth/login', credentials).then(res => res.data);
  },

  register: (userData: RegisterRequest): Promise<AuthResponse> => {
    return api.post('/auth/register', userData).then(res => res.data);
  },

  getMe: () =>
    api.get('/auth/me').then(res => res.data),

  updateProfile: (data: any) =>
    api.put('/auth/profile', data).then(res => res.data),

  getStravaAuthUrl: (action: 'login' | 'signup', redirectUrl?: string) => {
    const params = new URLSearchParams({ action });
    if (redirectUrl) {
      params.append('redirect_url', redirectUrl);
    }
    const url = `/auth/strava/auth-url?${params.toString()}`;
    return api.get(url).then(res => res.data);
  },

  logout: () =>
    api.post('/auth/logout').then(res => res.data),
};

export const stravaApi = {
  getAuthUrl: (redirectUrl?: string) =>
    api.get('/strava/auth-url', { params: { redirect_url: redirectUrl } }).then(res => res.data),

  connect: (code: string, state: string) =>
    api.post('/strava/connect', { code, state }).then(res => res.data),

  getRoutes: (page = 1, perPage = 30) =>
    api.get('/strava/routes', { params: { page, per_page: perPage } }).then(res => res.data),

  importRoute: (routeId: string) =>
    api.post(`/strava/routes/${routeId}/import`).then(res => res.data),

  getRoute: (routeId: string) =>
    api.get(`/strava/routes/${routeId}`).then(res => res.data),

  disconnect: () =>
    api.delete('/strava/disconnect').then(res => res.data),

  getStatus: () =>
    api.get('/strava/status').then(res => res.data),
};

export const routesApi = {
  getAll: (page = 1, limit = 20) =>
    api.get('/routes', { params: { page, limit } }).then(res => res.data),

  search: (query: string, page = 1, limit = 20) =>
    api.get('/routes/search', { params: { q: query, page, limit } }).then(res => res.data),

  getById: (routeId: number) =>
    api.get(`/routes/${routeId}`).then(res => res.data),

  delete: (routeId: number) =>
    api.delete(`/routes/${routeId}`).then(res => res.data),
};

export const ridesApi = {
  create: (data: any) =>
    api.post('/rides', data).then(res => res.data),

  getAll: (page = 1, limit = 20, search?: string) =>
    api.get('/rides', { params: { page, limit, search } }).then(res => res.data),

  getMyRides: (type: 'organized' | 'joined' = 'organized', page = 1, limit = 20) =>
    api.get('/rides/my-rides', { params: { type, page, limit } }).then(res => res.data),

  getById: (rideId: number) =>
    api.get(`/rides/${rideId}`).then(res => res.data),

  update: (rideId: number, data: any) =>
    api.put(`/rides/${rideId}`, data).then(res => res.data),

  delete: (rideId: number) =>
    api.delete(`/rides/${rideId}`).then(res => res.data),
};

export const rsvpApi = {
  createOrUpdate: (rideId: number, data: any) =>
    api.post(`/rides/${rideId}/rsvp`, data).then(res => res.data),

  getRideRsvps: (rideId: number, status?: string) =>
    api.get(`/rides/${rideId}/rsvps`, { params: { status } }).then(res => res.data),

  getUserRsvp: (rideId: number) =>
    api.get(`/rides/${rideId}/rsvp`).then(res => res.data),

  delete: (rideId: number) =>
    api.delete(`/rides/${rideId}/rsvp`).then(res => res.data),

  getStats: (rideId: number) =>
    api.get(`/rides/${rideId}/rsvp-stats`).then(res => res.data),
};

export const commentsApi = {
  getRideComments: (rideId: number) =>
    api.get(`/rides/${rideId}/comments`).then(res => res.data),

  create: (rideId: number, data: CreateCommentRequest) =>
    api.post(`/rides/${rideId}/comments`, data).then(res => res.data),

  update: (commentId: number, data: UpdateCommentRequest) =>
    api.put(`/comments/${commentId}`, data).then(res => res.data),

  delete: (commentId: number) =>
    api.delete(`/comments/${commentId}`).then(res => res.data),
};

export default api;