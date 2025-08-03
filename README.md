# 热点记忆 - 社会事件追踪应用 (Cloudflare Pages版)

一个基于现代Web技术栈的社会事件追踪系统，部署在Cloudflare Pages上，使用Neon PostgreSQL作为数据库。

## 🌟 核心特点

### 🤖 智能数据展示
- **实时事件展示**: 展示重要社会事件及其发展脉络
- **分类浏览**: 按科技、环境、经济等类别组织事件
- **搜索功能**: 支持关键词、分类和重要性筛选
- **时间线视图**: 清晰展示事件发展过程

### 📱 现代化界面
- **响应式设计**: 完美适配桌面端和移动端
- **Material风格**: 简洁美观的用户界面
- **实时搜索**: 动态搜索建议和结果高亮
- **无缝体验**: 快速加载和流畅交互

### ⚡ 高性能架构
- **边缘计算**: 基于Cloudflare Pages的全球CDN
- **Serverless Functions**: 无服务器API接口
- **现代数据库**: Neon PostgreSQL提供高可用性
- **静态优化**: 构建时优化的前端资源

## 🚀 技术架构

### 前端技术栈
- **React 18** + TypeScript - 现代化用户界面
- **Tailwind CSS** - 美观响应式设计  
- **React Router** - 单页应用路由
- **Axios** - HTTP请求处理
- **Vite** - 现代构建工具

### 后端技术栈
- **Cloudflare Pages Functions** - Serverless API
- **Neon PostgreSQL** - 现代化PostgreSQL数据库
- **TypeScript** - 类型安全的开发体验
- **SQL查询优化** - 高效的数据检索

### 部署架构
- **Cloudflare Pages** - 静态资源托管 + Serverless Functions
- **Neon Database** - 分布式PostgreSQL数据库
- **GitHub集成** - 自动CI/CD部署
- **全球CDN** - 极速访问体验

## 📁 项目结构

```
hotgone/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   │   ├── EventCard.tsx
│   │   │   ├── MobileEventCard.tsx
│   │   │   ├── MobileEventDetail.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Navbar.tsx
│   │   ├── pages/           # 页面组件
│   │   │   ├── HomePage.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   └── SearchPage.tsx
│   │   ├── types/           # TypeScript类型定义
│   │   ├── config/          # 配置文件
│   │   └── ...
│   ├── dist/                # 构建输出目录
│   └── package.json
├── functions/               # Cloudflare Pages Functions
│   └── api/
│       └── [[route]].ts     # API路由处理
├── database/               # 数据库相关
│   └── neon-schema.sql     # PostgreSQL架构文件
├── build.sh               # 构建脚本
├── wrangler.toml          # Cloudflare配置
└── README.md
```

## 🎯 主要功能

### 1. 事件浏览与搜索
- 按分类浏览：科技、环境、经济、社会等
- 实时搜索功能，支持标题和关键词匹配
- 重要性筛选和排序
- 响应式卡片布局

### 2. 事件详情展示
- 完整的事件描述和背景信息
- 详细的发展时间线
- 相关关键词和来源链接
- 移动端优化的阅读体验

### 3. 数据管理
- PostgreSQL关系型数据库
- 优化的SQL查询性能
- 支持复杂搜索和筛选
- 数据一致性和完整性保证

## 🛠 本地开发

### 环境要求
- Node.js 18+
- 现代浏览器
- Git

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/marrywu6/hotgone.git
cd hotgone
```

2. **安装依赖**
```bash
npm run install:all
```

3. **启动开发环境**
```bash
# 启动前端开发服务器
cd frontend
npm run dev

# 前端: http://localhost:5173
```

### 构建项目
```bash
# 构建前端静态资源
npm run build

# 或者使用构建脚本
bash build.sh
```

## 🚀 部署指南

### Cloudflare Pages部署

1. **GitHub集成**
   - 推送代码到GitHub仓库
   - 连接Cloudflare Pages到GitHub

2. **构建配置**
   - Build command: `npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/`

3. **环境变量配置**
   ```env
   DATABASE_URL=your_neon_database_url
   NODE_ENV=production
   ```

### 数据库设置 (Neon PostgreSQL)

1. **创建Neon数据库**
   - 访问 [neon.tech](https://neon.tech)
   - 创建新项目和数据库

2. **初始化数据库架构**
   ```bash
   # 在Neon SQL编辑器中运行
   psql your_database_url -f database/neon-schema.sql
   ```

3. **配置连接**
   - 复制数据库连接字符串
   - 在Cloudflare Pages中设置环境变量

## 📖 API文档

### 事件相关接口
```bash
GET /api/events                # 获取事件列表
GET /api/events/:id            # 获取事件详情  
GET /api/events/search?q=keyword&category=科技&importance=9
```

### 查询参数
- `q`: 搜索关键词
- `category`: 事件分类
- `importance`: 重要性级别 (1-10)
- `limit`: 返回数量限制
- `offset`: 分页偏移量

## 🗄 数据库架构

### 核心表结构

**events 表**
- `id`: 主键
- `title`: 事件标题
- `description`: 事件描述
- `category`: 事件分类
- `importance`: 重要性级别 (1-10)
- `keywords`: 关键词数组
- `sources`: 信息源链接数组
- `created_at`, `updated_at`: 时间戳

**event_timeline 表**
- `id`: 主键
- `event_id`: 关联事件ID
- `date`: 发生日期
- `title`: 时间线标题
- `content`: 详细内容
- `type`: 事件类型

### 示例数据
项目包含丰富的示例数据：
- 2024年人工智能技术突破
- 全球气候变化加剧
- 全球经济复苏与挑战
- 太空探索新进展
- 新能源汽车市场爆发

## ⚡ 性能优化

- **CDN加速**: Cloudflare全球边缘节点
- **静态资源优化**: Vite构建优化
- **数据库索引**: PostgreSQL查询优化
- **缓存策略**: 浏览器和CDN缓存
- **懒加载**: 组件和图片按需加载

## 🔒 安全特性

- **输入验证**: 严格的数据验证和过滤
- **SQL注入防护**: 参数化查询
- **XSS防护**: 内容转义和CSP策略
- **HTTPS强制**: 全站SSL加密
- **访问控制**: Cloudflare安全规则

## 📱 移动端适配

- **响应式布局**: 自适应各种屏幕尺寸
- **触摸优化**: 移动端交互优化
- **性能调优**: 移动端加载速度优化
- **PWA支持**: 渐进式Web应用特性

## 🔧 开发工具

- **TypeScript**: 类型安全开发
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vite**: 快速构建和热重载
- **Git Hooks**: 自动化代码检查

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔮 技术亮点

- ✅ **现代化架构**: Cloudflare Pages + Neon PostgreSQL
- ✅ **全栈TypeScript**: 类型安全的开发体验
- ✅ **Serverless**: 无服务器架构，自动扩展
- ✅ **全球CDN**: 极速访问体验
- ✅ **CI/CD**: GitHub集成自动部署
- ✅ **响应式设计**: 完美的移动端体验

## 🌐 在线访问

- **生产环境**: [https://hotgone.pages.dev](https://hotgone.pages.dev)
- **预览环境**: [https://preview.hotgone.pages.dev](https://preview.hotgone.pages.dev)

---

**构建状态**: [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com)
**数据库**: [![Neon](https://img.shields.io/badge/Neon-PostgreSQL-green)](https://neon.tech)
**框架**: [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org) 
