import axios from 'axios';

// ─────────────────────────────────────────────────────────────
//  Single source of truth for the API base URL.
//  Set VITE_API_URL in .env for production (e.g. https://api.railway.app)
// ─────────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Build API path for circular IDs that contain slashes (e.g. SEBI/2026-DEMO-009). */
export function circularApiPath(circularId: string, suffix = ''): string {
  const segments = circularId.split('/').map((s) => encodeURIComponent(s));
  return `/api/circulars/${segments.join('/')}${suffix}`;
}

export const circularsApi = {
  get: (circularId: string) =>
    apiClient.get('/api/circulars/by-id', { params: { circular_id: circularId } }),
  downloadUrl: (circularId: string) => `${API_BASE}${circularApiPath(circularId, '/download')}`,
};

// ─────────────────────────────────────────────────────────────
//  Axios instance
// ─────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Attach timestamp for duration calculation
  (config as any)._startTime = Date.now();
  return config;
});

// ── Response interceptor: error handling + judge mode log ────
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - ((response.config as any)._startTime ?? Date.now());

    // Judge mode request logging (global window registry)
    if ((window as any).__JUDGE_MODE_ENABLED) {
      const log: RequestLogEntry = {
        method: (response.config.method ?? 'GET').toUpperCase(),
        url: response.config.url ?? '',
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
        requestBody: response.config.data ? JSON.parse(response.config.data) : undefined,
        responseBody: response.data,
      };
      const existing: RequestLogEntry[] = (window as any).__JUDGE_LOG ?? [];
      (window as any).__JUDGE_LOG = [log, ...existing].slice(0, 20); // keep last 20
    }

    return response;
  },
  (error) => {
    // 401 → force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('session_id');
      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    // Re-throw so callers can handle
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
//  Typed helper — wraps apiClient for convenience
// ─────────────────────────────────────────────────────────────
export async function apiCall<T = any>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: unknown,
  config?: object
): Promise<T> {
  const response = await apiClient.request<T>({ method, url, data, ...config });
  return response.data;
}

// ─────────────────────────────────────────────────────────────
//  Maps API helpers (reusable across pages)
// ─────────────────────────────────────────────────────────────
export const mapsApi = {
  triageDashboard: () =>
    apiClient.get('/api/maps/triage/dashboard', { timeout: 30_000 }),
  generate: (gapId: string) => apiClient.post('/api/maps/generate', { gap_id: gapId }),
  list: (params?: Record<string, string | number | boolean>) =>
    apiClient.get('/api/maps', { params }),
  get: (mapId: string) => apiClient.get(`/api/maps/${mapId}`),
  approve: (mapId: string, body: object) => apiClient.post(`/api/maps/${mapId}/approve`, body),
  reject: (mapId: string, body: object) => apiClient.post(`/api/maps/${mapId}/reject`, body),
  escalate: (mapId: string, body: object) => apiClient.post(`/api/maps/${mapId}/escalate`, body),
  extend: (mapId: string, body: object) => apiClient.post(`/api/maps/${mapId}/extend`, body),
  bulkApprove: (mapIds: string[]) =>
    apiClient.post('/api/maps/bulk-approve', { map_ids: mapIds }),
  export: (format: 'json' | 'csv') =>
    apiClient.get('/api/maps/export', { params: { format } }),
  bulkReassign: (mapIds: string[], assignee: string, department?: string) =>
    apiClient.post('/api/maps/bulk-reassign', { map_ids: mapIds, assignee, department }),
};

// ─────────────────────────────────────────────────────────────
//  Type definitions
// ─────────────────────────────────────────────────────────────
export interface RequestLogEntry {
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

declare global {
  interface Window {
    __JUDGE_MODE_ENABLED?: boolean;
    __JUDGE_LOG?: RequestLogEntry[];
  }
}
