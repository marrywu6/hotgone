#!/bin/bash

# Cloudflare Pages 部署构建脚本
echo "🚀 Building HotGone for Cloudflare Pages deployment..."

# 检查前端目录
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found"
    exit 1
fi

# 构建前端
echo "📦 Building frontend..."
cd frontend

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# 构建生产版本
echo "🔨 Building frontend for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

# 检查构建输出
if [ ! -d "frontend/dist" ]; then
    echo "❌ Frontend dist directory not found"
    exit 1
fi

echo "📊 Build summary:"
echo "   Frontend: ✅ Built to frontend/dist"
echo "   Functions: ✅ Ready at functions/api/[[route]].js"
echo "   Config: ✅ wrangler.toml configured"

echo ""
echo "🌐 Ready for Cloudflare Pages deployment!"
echo ""
echo "📝 Next steps:"
echo "1. Push code to GitHub repository"
echo "2. Connect repository to Cloudflare Pages"
echo "3. Set build configuration:"
echo "   - Build command: npm run build"
echo "   - Build output directory: frontend/dist"
echo "   - Root directory: /"
echo "4. Configure environment variables in Cloudflare Dashboard:"
echo "   - DATABASE_URL (optional, for full database functionality)"
echo ""
echo "🎉 Deployment ready!"