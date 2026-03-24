import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: 'https://eryn-semihumanized-willard.ngrok-free.dev/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) { localStorage.removeItem('pos_token'); window.location.href = '/login'; }
    else if (err.response?.status >= 500) toast.error('Server error. Please try again.');
    return Promise.reject(err);
  }
);

export default api;
export const authApi = {
  login: (d: any) => api.post('/auth/login', d),
  register: (d: any) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
};
export const productsApi = {
  list: (p?: any) => api.get('/products', { params: p }),
  create: (d: any) => api.post('/products', d),
  update: (id: string, d: any) => api.put(`/products/${id}`, d),
  delete: (id: string) => api.delete(`/products/${id}`),
};
export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (d: any) => api.post('/categories', d),
  update: (id: string, d: any) => api.put(`/categories/${id}`, d),
  delete: (id: string) => api.delete(`/categories/${id}`),
};
export const ordersApi = {
  list: (p?: any) => api.get('/orders', { params: p }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (d: any) => api.post('/orders', d),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};
export const paymentsApi = {
  mpesaSTK: (d: any) => api.post('/payments/mpesa/stk-push', d),
  card: (d: any) => api.post('/payments/card', d),
  cash: (d: any) => api.post('/payments/cash', d),
  bankTransfer: (d: any) => api.post('/payments/bank-transfer', d),
  refund: (id: string, reason: string) => api.post(`/payments/${id}/refund`, { reason }),
};
export const customersApi = {
  list: (p?: any) => api.get('/customers', { params: p }),
  create: (d: any) => api.post('/customers', d),
  update: (id: string, d: any) => api.put(`/customers/${id}`, d),
};
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (p: any) => api.get('/reports/sales', { params: p }),
};
export const inventoryApi = {
  lowStock: () => api.get('/inventory/low-stock'),
  adjust: (d: any) => api.post('/inventory/adjust', d),
};

export const usersApi = {
  list: (_p: { search: string; }) => api.get('/users'),
  create: (d: any) => api.post('/users', d),
  update: (id: string, d: any) => api.put(`/users/${id}`, d),
  delete: (id: string) => api.delete(`/users/${id}`),
};
