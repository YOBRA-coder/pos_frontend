import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'https://eryn-semihumanized-willard.ngrok-free.dev/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');

          if (refreshToken) {
            try {
              const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
              localStorage.setItem('access_token', data.data.accessToken);
              localStorage.setItem('refresh_token', data.data.refreshToken);
              original.headers.Authorization = `Bearer ${data.data.accessToken}`;
              return this.client(original);
            } catch {
              localStorage.clear();
              window.location.href = '/login';
            }
          } else {
            localStorage.clear();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const api = new ApiService();

// ===== AUTH =====
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post<any>('/auth/login', { email, password }),
  logout: (refresh_token: string) => api.post('/auth/logout', { refresh_token }),
  getMe: () => api.get<any>('/auth/me'),
};

// ===== PRODUCTS =====
export const productApi = {
  getAll: (params?: any) => api.get<any>('/products', { params }),
  getOne: (id: string) => api.get<any>(`/products/${id}`),
  create: (data: any) => api.post<any>('/products', data),
  update: (id: string, data: any) => api.put<any>(`/products/${id}`, data),
  delete: (id: string) => api.delete<any>(`/products/${id}`),
  getCategories: () => api.get<any>('/categories'),
  createCategory: (data: any) => api.post<any>('/categories', data),
};

// ===== ORDERS =====
export const orderApi = {
  getAll: (params?: any) => api.get<any>('/orders', { params }),
  getOne: (id: string) => api.get<any>(`/orders/${id}`),
  create: (data: any) => api.post<any>('/orders', data),
  updateStatus: (id: string, status: string) => api.patch<any>(`/orders/${id}/status`, { status }),
};

// ===== CUSTOMERS =====
export const customerApi = {
  getAll: (params?: any) => api.get<any>('/customers', { params }),
  create: (data: any) => api.post<any>('/customers', data),
};

// ===== PAYMENTS =====
export const paymentApi = {
  mpesaSTKPush: (data: any) => api.post<any>('/payments/mpesa/stk-push', data),
  checkMpesaStatus: (payment_id: string) => api.get<any>(`/payments/mpesa/status/${payment_id}`),
  createStripeIntent: (data: any) => api.post<any>('/payments/stripe/intent', data),
  processCash: (data: any) => api.post<any>('/payments/cash', data),
};

// ===== DASHBOARD =====
export const dashboardApi = {
  getStats: () => api.get<any>('/dashboard/stats'),
};
