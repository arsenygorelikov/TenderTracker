import { AuthTokens, User } from '../types';

const API_BASE = '/api';

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  organization_name: string;
}

class ApiClient {
  private accessToken: string | null = null;
  
  setToken(token: string) {
    this.accessToken = token;
  }
  
  getToken(): string | null {
    return this.accessToken || localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  logout() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Обновление токенов через refresh endpoint
   */
  private async refreshTokens(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data: AuthTokens = await response.json();
      
      // Сохраняем новые токены
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      this.setToken(data.access_token);
      
      return data.access_token;
    } catch (error) {
      // Если не удалось обновить токен - разлогиниваем пользователя
      this.logout();
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Получает токен, при необходимости обновляя его
   */
  private async getValidToken(): Promise<string | null> {
    let token = this.getToken();
    
    // Если токена нет, пробуем обновить
    if (!token) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          token = await this.refreshTokens();
        } catch {
          return null;
        }
      }
    }
    
    return token;
  }

  /**
   * Основной метод для запросов к API с обработкой 401 и refresh токенов
   */
  private async requestWithRetry<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const token = await this.getValidToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Обработка 401 ошибки (истёк access токен)
    if (response.status === 401 && retryCount < 1) {
      try {
        // Пытаемся обновить токен
        const newToken = await this.refreshTokens();
        
        // Повторяем запрос с новым токеном
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ detail: 'Ошибка запроса' }));
          throw new Error(error.detail || 'Произошла ошибка');
        }
        
        return retryResponse.json();
      } catch (refreshError) {
        // Если не удалось обновить токен, выбрасываем ошибку
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка запроса' }));
      throw new Error(error.detail || 'Произошла ошибка');
    }

    return response.json();
  }

  /**
   * Публичный метод для запросов к API (используется в компонентах)
   */
  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.requestWithRetry(endpoint, options);
  }

  // Auth
  async login(email: string, password: string): Promise<AuthTokens> {
    const data = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    this.setToken(data.access_token);
    return data;
  }

  async register(data: RegisterData): Promise<AuthTokens> {
    const authData = await this.request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    this.setToken(authData.access_token);
    return authData;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Tenders
  async getTenders(): Promise<any[]> {
    return this.request<any[]>('/tenders');
  }

  async getTender(id: number): Promise<any> {
    return this.request<any>(`/tenders/${id}`);
  }

  async createTender(data: any): Promise<any> {
    return this.request<any>('/tenders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTender(id: number, data: any): Promise<any> {
    return this.request<any>(`/tenders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTender(id: number): Promise<void> {
    return this.request<void>(`/tenders/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async addComment(tenderId: number, content: string): Promise<any> {
    return this.request<any>(`/tenders/${tenderId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getAuditLog(tenderId: number): Promise<any[]> {
    return this.request<any[]>(`/tenders/${tenderId}/audit`);
  }
}

export const api = new ApiClient();
