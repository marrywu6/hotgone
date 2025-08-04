# Cloudflare Pages + Neon PostgreSQL 部署指南

## 前置条件

1. Neon PostgreSQL 数据库已创建
2. Cloudflare 账号已注册
3. wrangler CLI 已安装：`npm install -g wrangler`

## 部署步骤

### 1. 准备 Neon 数据库

```bash
# 在后端目录
cd backend

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构到 Neon
npx prisma db push

# 测试数据库连接
node test-db.js
```

### 2. 构建前端应用

```bash
# 在前端目录
cd frontend

# 安装依赖
npm install --legacy-peer-deps

# 构建生产版本
npm run build
```

### 3. 构建后端 API

```bash
# 在后端目录
cd backend

# 构建 TypeScript
npm run build

# 或者如果没有构建脚本，直接编译
npx tsc
```

### 4. 配置 Cloudflare Pages

```bash
# 登录 Cloudflare
wrangler login

# 部署到 Cloudflare Pages
wrangler pages deploy frontend/dist --project-name hotgone
```

### 5. 设置环境变量

在 Cloudflare Dashboard 中设置以下环境变量：

```
DATABASE_URL = postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
NODE_ENV = production
PORT = 3001
```

### 6. 配置自定义域名 (可选)

在 Cloudflare Dashboard 中配置自定义域名和 SSL 证书。

## 本地调试

### 开发环境启动

```bash
# 启动后端 API (端口 3001)
cd backend
npm run dev

# 启动前端开发服务器 (端口 5173)
cd frontend  
npm run dev
```

### 本地测试 Cloudflare Functions

```bash
# 使用 wrangler 本地开发
wrangler pages dev frontend/dist --port 8080

# 测试 API 端点
curl http://localhost:8080/api/events
curl http://localhost:8080/api/health
```

## API 端点说明

### 事件管理
- `GET /api/events` - 获取所有事件 (支持分页、筛选、排序)
- `GET /api/events/:id` - 获取单个事件详情
- `POST /api/events` - 创建新事件
- `PUT /api/events/:id` - 更新事件

### 日期搜索
- `GET /api/events/by-date/:date` - 按日期获取事件
- `GET /api/events/date-range?startDate=xxx&endDate=xxx` - 日期范围查询
- `GET /api/events/calendar/:year/:month` - 月度日历视图

### 热点事件
- `GET /api/events/hot/ranking` - 热点事件榜单
- `GET /api/events/search?q=keyword` - 搜索事件

### 事件分析
- `GET /api/events/:id/context` - 事件脉络分析
- `GET /api/events/:id/summary` - 事件摘要报告
- `GET /api/events/:id/related` - 相关事件

### 爬虫和更新
- `POST /api/crawl/trigger` - 手动触发爬虫
- `GET /api/cron/crawl` - Cron 任务端点 (Cloudflare)

### 系统
- `GET /api/health` - 健康检查

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 环境变量
   - 确认 Neon 数据库状态
   - 验证网络连接

2. **Prisma 客户端错误**
   - 重新生成客户端：`npx prisma generate`
   - 检查 schema.prisma 文件

3. **Cloudflare Functions 错误**
   - 检查函数日志
   - 验证环境变量设置
   - 确认构建输出正确

4. **CORS 错误**
   - 检查 API 中的 CORS 配置
   - 确认前端域名设置

### 监控和日志

- Cloudflare Dashboard -> Analytics
- Neon Dashboard -> Monitoring
- 应用日志通过 `console.log` 输出

## 生产环境优化

1. **数据库优化**
   - 使用连接池
   - 添加适当索引
   - 监控查询性能

2. **缓存策略**
   - Cloudflare Edge Cache
   - API 响应缓存
   - 静态资源 CDN

3. **安全设置**
   - API 速率限制
   - 输入验证
   - 环境变量加密

## 成本估算

- **Neon PostgreSQL**: 免费层 0.5GB，付费从 $29/月
- **Cloudflare Pages**: 免费层无限请求，付费从 $20/月
- **域名**: 可选，约 $10-15/年

## 持续集成

可设置 GitHub Actions 自动部署：

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install and Build
        run: |
          cd frontend && npm install --legacy-peer-deps && npm run build
          cd ../backend && npm install && npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: hotgone
          directory: frontend/dist
```