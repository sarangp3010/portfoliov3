import api from './axios';

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');
export const changePassword = (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data);

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data: Record<string, unknown>) => api.put('/profile', data);

// Projects
export const getProjects = () => api.get('/projects');
export const createProject = (data: Record<string, unknown>) => api.post('/projects', data);
export const updateProject = (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data);
export const deleteProject = (id: string) => api.delete(`/projects/${id}`);
export const deleteAllProjects = () => api.delete('/projects');
export const trackProjectClick = (id: string) => api.post(`/projects/${id}/click`);

// Blog
export const getPosts = (params?: { page?: number; tag?: string }) => api.get('/blog', { params });
export const getPost = (slug: string) => api.get(`/blog/${slug}`);
export const getTags = () => api.get('/blog/tags');
export const createPost = (data: Record<string, unknown>) => api.post('/blog', data);
export const updatePost = (id: string, data: Record<string, unknown>) => api.put(`/blog/${id}`, data);
export const deletePost = (id: string) => api.delete(`/blog/${id}`);
export const deleteAllPosts = () => api.delete('/blog');

// Services
export const getServices = () => api.get('/services');
export const createService = (data: Record<string, unknown>) => api.post('/services', data);
export const updateService = (id: string, data: Record<string, unknown>) => api.put(`/services/${id}`, data);
export const deleteService = (id: string) => api.delete(`/services/${id}`);
export const deleteAllServices = () => api.delete('/services');

// Testimonials
export const getTestimonials = () => api.get('/testimonials');
export const createTestimonial = (data: Record<string, unknown>) => api.post('/testimonials', data);
export const updateTestimonial = (id: string, data: Record<string, unknown>) => api.put(`/testimonials/${id}`, data);
export const deleteTestimonial = (id: string) => api.delete(`/testimonials/${id}`);
export const deleteAllTestimonials = () => api.delete('/testimonials');

// Resume
export const getActiveResume = () => api.get('/resume');
export const getAllResumes = () => api.get('/resume/all');
export const uploadResume = (formData: FormData) => api.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const activateResume = (id: string) => api.patch(`/resume/${id}/activate`);
export const deleteResume = (id: string) => api.delete(`/resume/${id}`);

// Inquiries
export const submitInquiry = (data: Record<string, unknown>) => api.post('/inquiries', data);
export const getInquiries = (params?: { page?: number; status?: string }) => api.get('/inquiries', { params });
export const updateInquiryStatus = (id: string, status: string) => api.patch(`/inquiries/${id}/status`, { status });
export const deleteInquiry = (id: string) => api.delete(`/inquiries/${id}`);

// Analytics
export const track = (data: Record<string, unknown>) => api.post('/analytics/track', data).catch(() => {});
export const getAnalyticsSummary = (days = 30) => api.get('/analytics/summary', { params: { days } });
export const getAnalyticsBlogStats = (days = 30) => api.get('/analytics/blogs', { params: { days } });
export const getAnalyticsProjectStats = (days = 30) => api.get('/analytics/projects', { params: { days } });
export const getAnalyticsVisitorInsights = (days = 30) => api.get('/analytics/visitors', { params: { days } });

// Feature Flags
export const getPublicFlags = () => api.get('/flags');
export const getAdminFlags = () => api.get('/admin/flags');
export const toggleFlag = (key: string, enabled: boolean) => api.patch(`/admin/flags/${key}/toggle`, { enabled });
export const patchFlag = (key: string, data: Record<string, unknown>) => api.patch(`/admin/flags/${key}`, data);

// Version History
export const getVersionHistory = (type: string, id: string) => api.get(`/versions/${type}/${id}`);
export const getVersionSnapshot = (versionId: string) => api.get(`/versions/snapshot/${versionId}`);
export const restoreVersion = (versionId: string) => api.post(`/versions/restore/${versionId}`);

// Real-Time Analytics
export const getActiveVisitors = () => api.get('/analytics/active');
export const getAnalyticsSessions = (page = 1) => api.get('/analytics/sessions', { params: { page } });
export const getSessionTimeline = (sessionId: string) => api.get(`/analytics/sessions/${sessionId}`);
export const getSmartInsights = (days = 30) => api.get('/analytics/insights', { params: { days } });
export const getNavFlows = (days = 30) => api.get('/analytics/flows', { params: { days } });

// Diagnostics
export const getDiagnostics = (hours = 24) => api.get('/dev/diagnostics', { params: { hours } });
export const getEventLog = (limit = 50) => api.get('/dev/event-log', { params: { limit } });

// ─── Payments ────────────────────────────────────────────────────────────────
export const getStripeKey      = () => api.get('/payments/key');
export const getServicePlans   = () => api.get('/payments/plans');
export const createCheckout    = (data: Record<string,unknown>) => api.post('/payments/checkout', data);
export const getPaymentStatus  = (sessionId: string) => api.get(`/payments/status/${sessionId}`);
export const listAdminPayments = (page = 1, source?: string) =>
  api.get('/admin/payments', { params: { page, ...(source ? { source } : {}) } });
export const getPaymentAnalytics = (days = 30) => api.get('/admin/payments/analytics', { params: { days } });

// ─── Theme ───────────────────────────────────────────────────────────────────
export const getTheme    = () => api.get('/theme');
export const updateTheme = (data: Record<string,unknown>) => api.put('/admin/theme', data);

// ─── PDF Export Data ─────────────────────────────────────────────────────────
export const getResumeData          = () => api.get('/pdf/resume-data');
export const getPortfolioData       = () => api.get('/pdf/portfolio-data');
export const getAnalyticsReportData = (days = 30) => api.get('/admin/pdf/analytics-data', { params: { days } });

// ─── Email Templates ─────────────────────────────────────────────────────────
export const getEmailTemplates    = ()                   => api.get('/admin/email-templates');
export const getEmailTemplate     = (id: string)         => api.get(`/admin/email-templates/${id}`);
export const createEmailTemplate  = (data: Record<string, unknown>) => api.post('/admin/email-templates', data);
export const updateEmailTemplate  = (id: string, data: Record<string, unknown>) => api.put(`/admin/email-templates/${id}`, data);
export const deleteEmailTemplate  = (id: string)         => api.delete(`/admin/email-templates/${id}`);
export const resetEmailTemplate   = (id: string)         => api.post(`/admin/email-templates/${id}/reset`);
export const previewEmailTemplate = (id: string, vars?: Record<string, string>) => api.post(`/admin/email-templates/${id}/preview`, { vars });
export const sendTestEmail        = (id: string, to: string, vars?: Record<string, string>) => api.post(`/admin/email-templates/${id}/test`, { to, vars });

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications     = (page = 1, unread = false) =>
  api.get('/notifications', { params: { page, ...(unread ? { unread: 'true' } : {}) } });
export const getUnreadCount       = () => api.get('/notifications/unread-count');
export const markNotificationRead = (id: string) => api.patch(`/notifications/${id}/read`);
export const markAllRead          = () => api.patch('/notifications/read-all');

// ─── Page Sections ────────────────────────────────────────────────────────────
export const listSectionPages     = ()                                         => api.get('/admin/sections');
export const getAdminSections     = (page: string)                             => api.get(`/admin/sections/${page}`);
export const createPageSection    = (data: Record<string, unknown>)            => api.post('/admin/sections', data);
export const updatePageSection    = (id: string, data: Record<string, unknown>)=> api.put(`/admin/sections/${id}`, data);
export const deletePageSection    = (id: string)                               => api.delete(`/admin/sections/${id}`);
export const reorderPageSections  = (order: { id: string; order: number }[])  => api.post('/admin/sections/reorder', { order });
export const togglePageSection    = (id: string)                               => api.patch(`/admin/sections/${id}/toggle`);
