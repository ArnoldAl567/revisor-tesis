import axios from 'axios';
import { getToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardApi = {
  overview: (params?: Record<string, string>) => api.get('/dashboard/overview', { params }),
};

export const programsApi = {
  list: () => api.get('/programs'),
};

export const usersApi = {
  list: (params?: { role?: string; programId?: string }) => api.get('/users', { params }),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const templatesApi = {
  list: (programId?: string) => api.get('/templates', { params: { programId } }),
  one: (id: string) => api.get(`/templates/${id}`),
  upload: (form: FormData) => api.post('/templates/upload', form),
  updateRubric: (id: string, rubric: unknown) => api.patch(`/templates/${id}/rubric`, { rubric }),
  activate: (id: string) => api.patch(`/templates/${id}/activate`),
};

export const advancesApi = {
  institutionConfig: () => api.get('/advances/institution-config'),
  updateInstitutionConfig: (body: unknown) => api.patch('/advances/institution-config', body),
  providers: () => api.get('/advances/ai-providers'),
  list: (params?: Record<string, string>) => api.get('/advances', { params }),
  one: (id: string) => api.get(`/advances/${id}`),
  upload: (form: FormData) =>
    api.post('/advances/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  fileUrl: (id: string) => `${API_URL}/advances/${id}/file`,
  pdfPreviewUrl: (id: string) => `${API_URL}/advances/${id}/pdf`,
  pdfDownloadUrl: (id: string) => `${API_URL}/advances/${id}/pdf?download=1`,
};

export const reviewsApi = {
  list: (params?: Record<string, string>) => api.get('/reviews/advances', { params }),
  one: (id: string) => api.get(`/reviews/advances/${id}`),
  save: (id: string, body: unknown) => api.patch(`/reviews/advances/${id}`, body),
  versions: (groupId: string) => api.get(`/reviews/groups/${groupId}/versions`),
  annotate: (id: string, body: { authorId: string; content: string; page?: number; paragraph?: string }) =>
    api.post(`/reviews/advances/${id}/annotations`, body),
};

export const bulkApi = {
  eligible: (params?: { programId?: string; status?: string }) =>
    api.get('/bulk/eligible', { params }),
  jobs: () => api.get('/bulk/jobs'),
  job: (id: string) => api.get(`/bulk/jobs/${id}`),
  create: (body: unknown) => api.post('/bulk/jobs', body),
};

export const statsApi = {
  analytics: (programId?: string) => api.get('/stats/analytics', { params: { programId } }),
  csv: (programId?: string) => `${API_URL}/stats/export/csv?programId=${programId || ''}`,
};

export const reportsApi = {
  acta: (advanceId: string) => `${API_URL}/reports/acta/${advanceId}`,
  actaPdf: (advanceId: string) => `${API_URL}/reports/acta/${advanceId}/pdf`,
  versions: (groupId: string) => `${API_URL}/reports/versions/${groupId}`,
  versionsData: (groupId: string) => api.get(`/reports/versions/${groupId}`),
};

export const notificationsApi = {
  list: (userId?: string, unread?: boolean) =>
    api.get('/notifications', { params: { userId, unread: unread ? 'true' : undefined } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const activityApi = {
  list: (limit?: number) => api.get('/activity', { params: { limit } }),
};
