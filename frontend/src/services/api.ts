import { AuthTokens, User } from '../types';

const API_BASE = '/api';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken || localStorage.getItem('access_token');
  }

  logout() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Ошибка запроса' }));
      throw new Error(error.detail || 'Произошла ошибка');
    }

    return response.json();
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
