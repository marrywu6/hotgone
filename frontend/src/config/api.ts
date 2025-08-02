// API配置 - Cloudflare Pages环境
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:8788/api' // Cloudflare Workers本地开发端口
  : '/api'; // Cloudflare Pages生产环境

export const createApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;