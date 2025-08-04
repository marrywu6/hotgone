# Neon Database Setup Instructions

## 1. 创建 Neon 数据库

1. 访问 https://neon.tech 并创建账号
2. 创建新的 PostgreSQL 数据库项目
3. 复制连接字符串到 .env 文件中

## 2. 更新 .env 文件

```env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

## 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构到 Neon
npx prisma db push

# 可选：查看数据库
npx prisma studio
```

## 4. 测试数据库连接

```bash
node test-db.js
```

## 5. 启动开发服务器

```bash
npm run dev
```

## 数据库架构说明

数据库包含以下表：
- `Event`: 存储社会热点事件
- `Timeline`: 存储事件时间线
- `User`: 用户管理 (预留)

## 重要提醒

- Neon 免费版有连接数限制，生产环境需要付费计划
- 确保 DATABASE_URL 中包含正确的 SSL 设置
- 本地开发和生产环境使用不同的数据库实例