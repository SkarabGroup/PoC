import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Transform _id to id in responses
const transformResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformResponse);
  }
  if (data && typeof data === 'object') {
    const transformed = { ...data };
    if (transformed._id) {
      transformed.id = transformed._id;
    }
    // Transform nested objects
    Object.keys(transformed).forEach(key => {
      if (transformed[key] && typeof transformed[key] === 'object') {
        transformed[key] = transformResponse(transformed[key]);
      }
    });
    return transformed;
  }
  return data;
};

apiClient.interceptors.response.use(
  (response) => {
    // Transform _id to id in response data
    if (response.data) {
      response.data = transformResponse(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Don't retry auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // If 401 and not already retrying and not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setToken(accessToken);
        setRefreshToken(newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.message || error.message || 'Errore sconosciuto';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).response = error.response;
    (enhancedError as any).status = error.response?.status;

    return Promise.reject(enhancedError);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { accessToken, refreshToken, user } = response.data;
    setToken(accessToken);
    setRefreshToken(refreshToken);
    return { accessToken, refreshToken, user };
  },

  register: async (username: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    const { accessToken, refreshToken, user } = response.data;
    setToken(accessToken);
    setRefreshToken(refreshToken);
    return { accessToken, refreshToken, user };
  },

  logout: () => {
    clearTokens();
  },
};

// Users API
export const usersApi = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { email?: string; notificationsEnabled?: boolean; criticalIssuesNotifications?: boolean }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    await apiClient.put('/users/password', { currentPassword, newPassword });
  },

  generateApiKey: async () => {
    const response = await apiClient.post('/users/api-key/generate');
    return response.data.apiKey;
  },

  deleteAccount: async () => {
    await apiClient.delete('/users/account');
  },

  disconnectOAuth: async (provider: 'github' | 'gitlab') => {
    const response = await apiClient.delete(`/users/oauth/${provider}`);
    return response.data;
  },
};

// Repositories API
export const repositoriesApi = {
  getAll: async (search?: string) => {
    const response = await apiClient.get('/repositories', {
      params: search ? { search } : {},
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await apiClient.get(`/repositories/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string; url: string }) => {
    const response = await apiClient.post('/repositories', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string; url?: string }) => {
    const response = await apiClient.put(`/repositories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/repositories/${id}`);
  },

  getRanking: async () => {
    const response = await apiClient.get('/repositories/ranking');
    return response.data;
  },
};

// Analysis API
export const analysisApi = {
  startAnalysis: async (repositoryId: string, branch?: string, areas?: { code: boolean; documentation: boolean; tests: boolean; security: boolean }) => {
    const response = await apiClient.post(`/repositories/${repositoryId}/analyze`, { branch, areas });
    return response.data;
  },

  getLatestAnalysis: async (repositoryId: string) => {
    const response = await apiClient.get(`/repositories/${repositoryId}/analysis`);
    return response.data;
  },

  getAnalysisHistory: async (repositoryId: string) => {
    const response = await apiClient.get(`/repositories/${repositoryId}/analysis/history`);
    return response.data;
  },

  getAllAnalysisHistory: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/analysis', {
      params: { page, limit },
    });
    return response.data;
  },

  exportReport: async (analysisId: string, format: 'json' | 'pdf' | 'csv' | 'markdown') => {
    const response = await apiClient.post(`/analysis/${analysisId}/export`, { format }, {
      responseType: 'blob',
    });
    return response.data;
  },

  saveRemediationDecision: async (analysisId: string, remediationIndex: number, decision: 'accepted' | 'rejected') => {
    const response = await apiClient.patch(`/analysis/${analysisId}/remediation/decision`, {
      remediationIndex,
      decision,
    });
    return response.data;
  },

  compareAnalyses: async (repositoryId: string, from?: string, to?: string) => {
    const response = await apiClient.get(`/repositories/${repositoryId}/analysis/compare`, {
      params: { from, to },
    });
    return response.data;
  },
};

export default apiClient;
