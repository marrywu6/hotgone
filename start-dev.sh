#!/bin/bash

# 本地开发环境启动脚本
# Local Development Environment Setup Script

echo "🚀 启动 HotGone 本地开发环境..."
echo "🚀 Starting HotGone Local Development Environment..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "❌ Node.js not found, please install Node.js first"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# 检查当前目录
if [ ! -f "./backend/package.json" ] || [ ! -f "./frontend/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# 设置后端
echo "📦 设置后端..."
echo "📦 Setting up backend..."
cd backend

# 安装后端依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装后端依赖..."
    npm install
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  创建 .env 模板文件..."
    cat > .env << EOL
# Neon PostgreSQL Database
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ENDPOINT.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Server Configuration
PORT=3001
NODE_ENV=development

# API Keys (如果需要)
# NEWS_API_KEY=your_news_api_key_here
EOL
    echo "📝 请编辑 backend/.env 文件并设置正确的 DATABASE_URL"
    echo "📝 Please edit backend/.env file and set correct DATABASE_URL"
fi

# Prisma 设置
echo "🗄️  设置数据库..."
if [ -f ".env" ]; then
    # 生成 Prisma 客户端
    npx prisma generate
    
    # 检查数据库连接
    echo "🔍 测试数据库连接..."
    if node test-db.js 2>/dev/null; then
        echo "✅ 数据库连接成功"
    else
        echo "⚠️  数据库连接失败，请检查 DATABASE_URL 设置"
        echo "⚠️  Database connection failed, please check DATABASE_URL"
    fi
fi

cd ..

# 设置前端
echo "🎨 设置前端..."
echo "🎨 Setting up frontend..."
cd frontend

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装前端依赖..."
    npm install --legacy-peer-deps
fi

cd ..

# 启动服务
echo "🚀 启动开发服务器..."
echo "🚀 Starting development servers..."

# 检查端口占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  端口 $1 已被占用"
        return 1
    fi
    return 0
}

# 启动后端
echo "🔧 启动后端 API (端口 3001)..."
cd backend
if check_port 3001; then
    npm run dev &
    BACKEND_PID=$!
    echo "✅ 后端启动成功，PID: $BACKEND_PID"
else
    echo "❌ 端口 3001 被占用，请先关闭占用进程"
    exit 1
fi

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端开发服务器 (端口 5173)..."
cd ../frontend
if check_port 5173; then
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ 前端启动成功，PID: $FRONTEND_PID"
else
    echo "❌ 端口 5173 被占用，请先关闭占用进程"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 等待服务器完全启动
echo "⏳ 等待服务器启动..."
sleep 5

# 测试服务
echo "🧪 测试服务连接..."

# 测试后端 API
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端 API 运行正常: http://localhost:3001"
else
    echo "⚠️  后端 API 连接失败"
fi

# 测试前端
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务运行正常: http://localhost:5173"
else
    echo "⚠️  前端服务连接失败"
fi

echo ""
echo "🎉 开发环境启动完成！"
echo "🎉 Development environment is ready!"
echo ""
echo "📊 服务地址:"
echo "📊 Service URLs:"
echo "   前端 Frontend: http://localhost:5173"
echo "   后端 Backend:  http://localhost:3001"
echo "   API文档 API:   http://localhost:3001/api/health"
echo ""
echo "📝 常用命令:"
echo "📝 Common Commands:"
echo "   手动爬虫: curl -X POST http://localhost:3001/api/crawl/trigger"
echo "   健康检查: curl http://localhost:3001/api/health"
echo "   查看事件: curl http://localhost:3001/api/events"
echo ""
echo "🛑 停止服务: Ctrl+C 或运行 pkill -f 'npm run dev'"
echo "🛑 Stop services: Ctrl+C or run pkill -f 'npm run dev'"
echo ""

# 保存进程 ID 到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo "✅ 服务已停止"; exit 0' INT

echo "💡 按 Ctrl+C 停止所有服务"
echo "💡 Press Ctrl+C to stop all services"

# 保持脚本运行
wait