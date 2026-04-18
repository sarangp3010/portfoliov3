import axios from 'axios';

export const api = axios.create({
  // Relative path — proxied to Express :5000 via Vite (dev) or nginx (prod)
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('customer_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('customer_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const customerLogin = (email: string, password: string) =>
  api.post('/customer/auth/login', { email, password });

export const customerRegister = (data: { email: string; password: string; name: string; phone?: string }) =>
  api.post('/customer/auth/register', data);

export const customerMe = () => api.get('/customer/auth/me');

export const customerLogout = () => api.post('/customer/auth/logout');

export const getOAuthUrl = (provider: 'google' | 'github' | 'microsoft') =>
  api.get(`/customer/auth/oauth/${provider}`);

// ─── Services ─────────────────────────────────────────────────────────────
export const getServicePlans = () => api.get('/payments/plans');

// ─── Payments ─────────────────────────────────────────────────────────────
export const getCustomerPayments = (page = 1) =>
  api.get(`/customer/payments?page=${page}`);

export const createCheckout = (data: { planId: string; planName: string; amount: number }) =>
  api.post('/customer/payments/checkout', data);

export const getPaymentReceipt = (paymentId: string) =>
  api.get(`/customer/payments/${paymentId}/receipt`);

// ─── Payment Methods ─────────────────────────────────────────────────────
export const getPaymentMethods = () => api.get('/customer/payment-methods');

export const addPaymentMethod = () => api.post('/customer/payment-methods/setup');

export const deletePaymentMethod = (pmId: string) =>
  api.delete(`/customer/payment-methods/${pmId}`);

// ─── Messages ─────────────────────────────────────────────────────────────
export const sendMessage = (message: string) =>
  api.post('/customer/messages', { message });

// ─── Profile ──────────────────────────────────────────────────────────────
export const updateCustomerProfile = (data: { name?: string; phone?: string }) =>
  api.put('/customer/profile', data);

// ─── Developer Links ──────────────────────────────────────────────────────
export const getDevProfile = () => api.get('/profile');

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications     = (page = 1, unread = false) =>
  api.get('/notifications', { params: { page, ...(unread ? { unread: 'true' } : {}) } });
export const getUnreadCount       = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id: string) => api.patch(`/notifications/${id}/read`);
export const markAllRead          = () => api.patch('/notifications/read-all');
