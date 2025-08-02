// API配置
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // 在Vercel上使用相对路径
  : 'http://localhost:3001/api';

export const createApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;