// API配置
export const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api';

export const createApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;