# Cloudflare Pages + Neon PostgreSQL 部署指南

## 免费资源配置

### 1. Neon PostgreSQL (免费数据库)
- 访问 [Neon.tech](https://neon.tech)
- 创建免费账户
- 创建新项目，获取连接字符串
- 免费套餐：512MB存储，支持大量数据

### 2. Cloudflare Pages (免费托管)
- 访问 [Cloudflare Pages](https://pages.cloudflare.com)
- 连接你的GitHub仓库
- 配置构建设置

## 部署步骤

### 第一步：设置数据库
1. 登录Neon控制台
2. 复制数据库连接字符串
3. 在Neon SQL编辑器中运行 `database/neon-schema.sql` 创建表结构

### 第二步：配置Cloudflare Pages
1. 在Cloudflare Pages中创建新项目
2. 连接GitHub仓库 `hotgone`
3. 配置构建设置：
   ```
   构建命令: cd frontend && npm run build
   构建输出目录: frontend/dist
   根目录: /
   ```

### 第三步：设置环境变量
在Cloudflare Pages项目设置中添加环境变量：
```
DATABASE_URL = [你的Neon数据库连接字符串]
DATABASE_TOKEN = [如果需要的话]
NODE_ENV = production
```

### 第四步：部署
推送代码到GitHub，Cloudflare Pages会自动构建和部署

## 本地开发

### 安装依赖
```bash
npm run install:all
```

### 启动开发服务器
```bash
# 构建前端
cd frontend && npm run build && cd ..

# 启动Cloudflare Workers本地服务
npm run dev:functions

# 另开终端启动前端开发服务器
npm run dev:frontend
```

## 数据库优势

### Neon PostgreSQL 特点：
- **免费套餐**：512MB存储
- **高性能**：支持大量并发查询
- **自动备份**：数据安全保障
- **REST API**：完美适配Cloudflare Workers
- **PostgreSQL兼容**：支持复杂查询和JSON数据

### 数据容量估算：
- 每个事件记录 ≈ 2KB
- 512MB可存储约 250,000 个事件
- 包含完整时间线和元数据

## API端点

- `GET /api/events` - 获取事件列表
- `GET /api/events/:id` - 获取单个事件
- `GET /api/events/search?q=关键词` - 搜索事件
- `GET /api/health` - 健康检查

## 成本分析

- **Cloudflare Pages**：免费（包含自定义域名、SSL）
- **Neon PostgreSQL**：免费512MB
- **总成本**：完全免费
- **扩展选项**：按需付费升级

这个方案可以轻松处理大量数据，性能优秀，完全免费！