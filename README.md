# 热点记忆 - 社会事件追踪应用 (Neon PostgreSQL + Cloudflare Pages)

一个基于现代Web技术栈的社会热点事件追踪系统，专注于记录和分析像"黄杨耳环"、"哈佛蒋"、"协和董"、"武大杨景媛"等引起社会广泛关注的事件，提供清晰的事件脉络和前因后果分析。

## 🌟 核心特点

### 🔥 热点事件聚焦
- **智能热点识别**: 自动识别和跟踪社会热点事件
- **事件脉络分析**: 清晰展示事件的前因后果和发展脉络  
- **关键人物追踪**: 重点关注事件中的关键人物和机构
- **时间线还原**: 完整还原事件发展的时间顺序

### 📅 按日期检索
- **日期精确搜索**: 支持按具体日期查找相关事件
- **日期范围查询**: 可查询指定时间段内的所有事件
- **月度日历视图**: 以日历形式展示每月的事件分布
- **时间统计分析**: 按日期、月份统计事件数量和类型

### 🤖 智能数据展示
- **实时事件展示**: 展示重要社会事件及其发展脉络
- **分类浏览**: 按科技、环境、经济等类别组织事件
- **搜索功能**: 支持关键词、分类和重要性筛选
- **重要性排序**: 根据社会影响力和关注度排序

### ⚡ 高性能架构
- **Neon PostgreSQL**: 现代化云数据库，高可用性
- **Cloudflare Pages**: 全球CDN加速，边缘计算
- **Express.js API**: 高效的RESTful API接口
- **Prisma ORM**: 类型安全的数据库操作

## 🚀 技术架构

### 前端技术栈
- **React 18** + TypeScript - 现代化用户界面
- **Tailwind CSS** - 美观响应式设计  
- **React Router** - 单页应用路由
- **Axios** - HTTP请求处理
- **Vite** - 现代构建工具

### 后端技术栈
- **Node.js + Express** - 高性能服务器
- **Neon PostgreSQL** - 现代化PostgreSQL数据库
- **Prisma ORM** - 类型安全的数据库操作
- **TypeScript** - 类型安全的开发体验
- **智能爬虫系统** - 自动收集热点事件

### 部署架构
- **Cloudflare Pages** - 静态资源托管
- **Neon Database** - 分布式PostgreSQL数据库
- **GitHub集成** - 自动CI/CD部署
- **全球CDN** - 极速访问体验

## 📁 项目结构

```
hotgone/
├── backend/                  # Node.js后端API
│   ├── src/
│   │   ├── models/          # 数据模型 (Prisma)
│   │   │   └── Event.ts     # 事件模型
│   │   ├── routes/          # API路由
│   │   │   └── events.ts    # 事件相关API
│   │   ├── services/        # 业务逻辑
│   │   │   ├── crawler.ts   # 热点事件爬虫
│   │   │   ├── eventTimeline.ts # 事件脉络分析
│   │   │   └── updater.ts   # 事件更新服务
│   │   ├── lib/             # 工具库
│   │   │   └── database.ts  # 数据库连接
│   │   └── server.ts        # 服务器入口
│   ├── prisma/
│   │   └── schema.prisma    # 数据库架构
│   ├── test-db.js          # 数据库测试脚本
│   └── package.json
├── frontend/                # React前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   └── types/          # TypeScript类型定义
│   ├── dist/               # 构建输出目录
│   └── package.json
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       └── [[route]].js    # API路由处理
├── start-dev.sh/.bat      # 开发环境启动脚本
├── validate-setup.sh      # 项目设置验证脚本
├── wrangler.toml          # Cloudflare配置
└── README.md
```

## 🎯 主要功能

### 1. 热点事件追踪
- 自动识别社会热点事件 (黄杨耳环、哈佛蒋、协和董、武大杨景媛等)
- 智能关键词匹配和重要性评分
- 事件脉络分析和前因后果梳理
- 相关事件关联和推荐

### 2. 日期检索系统
- 按具体日期查找事件: `GET /api/events/by-date/2024-08-03`
- 日期范围查询: `GET /api/events/date-range?startDate=2024-08-01&endDate=2024-08-03`
- 月度日历视图: `GET /api/events/calendar/2024/8`
- 日期统计分析

### 3. 事件详情展示
- 完整的事件描述和背景信息
- 详细的发展时间线
- 相关关键词和来源链接
- 移动端优化的阅读体验

### 4. 智能搜索
- 全文搜索支持
- 按分类、重要性筛选
- 实时搜索建议
- 相关事件推荐

## 🛠 本地开发

### 环境要求
- Node.js 18+
- Git
- Neon PostgreSQL账号 (免费)

### 快速开始

1. **项目设置验证**
```bash
git clone <repository_url>
cd hotgone
./validate-setup.sh  # 或在Windows上运行 validate-setup.bat
```

2. **一键启动开发环境**
```bash
# Linux/Mac
./start-dev.sh

# Windows
start-dev.bat
```

3. **手动启动 (可选)**
```bash
# 后端 (端口 3001)
cd backend
npm install
npm run setup      # 安装依赖 + 生成Prisma客户端 + 测试数据库
npm run dev

# 前端 (端口 5173)  
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 数据库设置

1. **创建Neon数据库**
   - 访问 [neon.tech](https://neon.tech) 并创建账号
   - 创建新的PostgreSQL项目
   - 复制连接字符串

2. **配置环境变量**
```bash
# 编辑 backend/.env
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

3. **初始化数据库**
```bash
cd backend
npx prisma db push    # 推送架构到数据库
npm run test         # 测试数据库连接
```

## 📖 API文档

### 事件管理
```bash
GET /api/events                     # 获取事件列表 (支持分页、筛选、排序)
GET /api/events/:id                 # 获取事件详情
POST /api/events                    # 创建新事件
PUT /api/events/:id                 # 更新事件
```

### 日期搜索 🆕
```bash
GET /api/events/by-date/2024-08-03  # 获取特定日期的事件
GET /api/events/date-range?startDate=2024-08-01&endDate=2024-08-03  # 日期范围查询
GET /api/events/calendar/2024/8     # 月度日历视图
```

### 热点事件
```bash
GET /api/events/hot/ranking         # 热点事件榜单
GET /api/events/search?q=keyword    # 搜索事件
```

### 事件分析
```bash
GET /api/events/:id/context         # 事件脉络分析
GET /api/events/:id/summary         # 事件摘要报告
GET /api/events/:id/related         # 相关事件
```

### 爬虫和更新
```bash
POST /api/crawl/trigger             # 手动触发爬虫
GET /api/cron/crawl                 # Cron任务端点
```

### 系统监控
```bash
GET /api/health                     # 健康检查
```

## 🚀 部署指南

### 1. Neon数据库部署
```bash
# 详细说明见 backend/NEON-SETUP.md
1. 创建Neon账号和数据库
2. 配置连接字符串
3. 推送数据库架构
4. 测试连接
```

### 2. Cloudflare Pages部署
```bash
# 详细说明见 CLOUDFLARE-DEPLOYMENT.md
1. 连接GitHub仓库到Cloudflare Pages
2. 设置构建配置
3. 配置环境变量
4. 自动部署
```

### 3. 本地调试
```bash
# 使用wrangler本地调试
npm install -g wrangler
wrangler pages dev frontend/dist --port 8080
```

## 🗄 数据库架构

### 核心表结构 (PostgreSQL + Prisma)

**Event 表**
```sql
model Event {
  id          String   @id @default(cuid())
  title       String
  description String
  category    String
  status      EventStatus @default(ACTIVE)
  importance  Int      @default(1)
  keywords    String[]
  sources     String[]
  timeline    Timeline[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Timeline 表**
```sql
model Timeline {
  id       String   @id @default(cuid())
  eventId  String
  date     DateTime
  title    String
  content  String
  source   String?
  type     TimelineType
  event    Event    @relation(fields: [eventId], references: [id])
}
```

### 热点事件示例数据
- 黄杨耳环事件 - 网络热议话题
- 哈佛蒋事件 - 教育公平讨论  
- 协和董事件 - 医疗行业关注
- 武大杨景媛事件 - 校园文化现象
- 董宇辉与东方甄选 - 商业模式变革

## 🔧 开发工具和脚本

### 便捷脚本
```bash
./start-dev.sh          # 一键启动开发环境
./validate-setup.sh     # 项目设置验证
npm run setup           # 后端完整设置
npm run test            # 数据库连接测试
```

### 数据库工具
```bash
npx prisma studio       # 可视化数据库管理
npx prisma db push      # 推送架构更改
npx prisma generate     # 生成客户端代码
```

## 📱 特色功能

### 🔥 热点事件智能识别
系统专门针对社会热点事件进行优化，能够识别和跟踪：
- 网络热议话题 (黄杨耳环、哈佛蒋等)
- 教育社会事件 (协和董、武大杨景媛等)  
- 商业文化现象 (董宇辉、东方甄选等)
- 及时的脉络分析和前因后果梳理

### 📅 强大的日期检索
- 精确到日的事件查询
- 灵活的日期范围筛选
- 直观的月度日历视图
- 详细的时间统计分析

### 🧠 智能事件分析
- 自动提取事件关键信息
- 智能关联相关事件
- 重要性自动评分
- 发展脉络智能分析

## 🌐 在线访问

- **生产环境**: 待部署
- **GitHub仓库**: [https://github.com/your-username/hotgone](https://github.com/your-username/hotgone)

---

**构建状态**: [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com)
**数据库**: [![Neon](https://img.shields.io/badge/Neon-PostgreSQL-green)](https://neon.tech)
**框架**: [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org) [![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org) 
