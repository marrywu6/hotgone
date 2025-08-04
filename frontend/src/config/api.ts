// API配置 - 支持本地开发和Cloudflare Pages环境
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api' // 本地后端服务器端口
  : '/api'; // Cloudflare Pages生产环境

export const createApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;