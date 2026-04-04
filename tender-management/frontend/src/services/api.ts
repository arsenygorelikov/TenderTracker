import axios from 'axios';
import type { AuthTokens, LoginCredentials, RegisterData, Tender, TenderEvent, TenderChangeLog } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Создание axios инстанса
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const tokens = response.data;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    return tokens;
  },

  register: async (data: RegisterData): Promise<any> => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export const tenderService = {
  getTenders: async (): Promise<Tender[]> => {
    const response = await api.get('/tenders');
    return response.data;
  },

  getTender: async (id: string): Promise<Tender> => {
    const response = await api.get(`/tenders/${id}`);
    return response.data;
  },

  createTender: async (data: Partial<Tender>): Promise<Tender> => {
    const response = await api.post('/tenders', data);
    return response.data;
  },

  updateTender: async (id: string, data: Partial<Tender>): Promise<Tender> => {
    const response = await api.put(`/tenders/${id}`, data);
    return response.data;
  },

  deleteTender: async (id: string): Promise<void> => {
    await api.delete(`/tenders/${id}`);
  },

  getEvents: async (tenderId: string): Promise<TenderEvent[]> => {
    const response = await api.get(`/tenders/${tenderId}/events`);
    return response.data;
  },

  createEvent: async (tenderId: string, data: Partial<TenderEvent>): Promise<TenderEvent> => {
    const response = await api.post(`/tenders/${tenderId}/events`, data);
    return response.data;
  },

  getChangeLog: async (tenderId: string): Promise<TenderChangeLog[]> => {
    const response = await api.get(`/tenders/${tenderId}/change-log`);
    return response.data;
  },
};
