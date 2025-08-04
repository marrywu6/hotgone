// Cloudflare Pages Functions 入口点
// 将 Express 应用适配到 Cloudflare 运行时

import { Request, Response } from '@cloudflare/workers-types';

// 动态导入 Express 应用
let expressApp;

export async function onRequest(context) {
  // 如果是第一次请求，初始化 Express 应用
  if (!expressApp) {
    // 动态导入后端应用
    const { default: app } = await import('../backend/src/server.js');
    expressApp = app;
  }

  // 创建 Request 和 Response 适配器
  const { request, env } = context;
  
  // 设置环境变量
  process.env.DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;
  process.env.NODE_ENV = env.NODE_ENV || 'production';
  
  try {
    // 将 Cloudflare Request 转换为 Node.js 兼容格式
    const url = new URL(request.url);
    const method = request.method;
    const headers = {};
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    let body;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }
    
    // 创建模拟的 Node.js req/res 对象
    const req = {
      method,
      url: url.pathname + url.search,
      headers,
      body,
      // 其他 Express 需要的属性
    };
    
    const res = {
      statusCode: 200,
      headers: {},
      body: '',
      
      status(code) {
        this.statusCode = code;
        return this;
      },
      
      json(data) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        return this;
      },
      
      send(data) {
        this.body = data;
        return this;
      },
      
      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      }
    };
    
    // 处理请求
    await new Promise((resolve, reject) => {
      expressApp(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 返回 Cloudflare Response
    return new Response(res.body, {
      status: res.statusCode,
      headers: res.headers
    });
    
  } catch (error) {
    console.error('Cloudflare Function Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}