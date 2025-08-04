#!/bin/bash

# 项目设置验证脚本
# Project Setup Validation Script

echo "🔍 验证 HotGone 项目设置..."
echo "🔍 Validating HotGone Project Setup..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查项目结构
echo ""
echo "📁 检查项目结构..."

required_files=(
    "backend/package.json"
    "backend/prisma/schema.prisma"
    "backend/src/server.ts"
    "backend/src/models/Event.ts"
    "backend/src/routes/events.ts"
    "backend/src/lib/database.ts"
    "backend/test-db.js"
    "frontend/package.json"
    "wrangler.toml"
    "start-dev.sh"
    "start-dev.bat"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        success "文件存在: $file"
    else
        error "文件缺失: $file"
    fi
done

# 检查 Node.js
echo ""
echo "🟢 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js 已安装: $NODE_VERSION"
    
    # 检查版本是否符合要求 (>= 18)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        success "Node.js 版本符合要求 (>= 18)"
    else
        warning "建议升级 Node.js 到版本 18 或更高"
    fi
else
    error "Node.js 未安装，请安装 Node.js 18+"
fi

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm 已安装: v$NPM_VERSION"
else
    error "npm 未安装"
fi

# 检查后端依赖
echo ""
echo "📦 检查后端依赖..."
cd backend 2>/dev/null
if [ $? -eq 0 ]; then
    if [ -d "node_modules" ]; then
        success "后端依赖已安装"
        
        # 检查关键依赖
        key_deps=("@prisma/client" "express" "cors" "dotenv" "tsx")
        for dep in "${key_deps[@]}"; do
            if [ -d "node_modules/$dep" ]; then
                success "依赖存在: $dep"
            else
                warning "依赖缺失: $dep"
            fi
        done
        
    else
        warning "后端依赖未安装，运行: cd backend && npm install"
    fi
    
    # 检查 .env 文件
    if [ -f ".env" ]; then
        success ".env 文件存在"
        
        # 检查环境变量
        if grep -q "DATABASE_URL=" .env; then
            if grep -q "YOUR_PASSWORD" .env; then
                warning ".env 中的 DATABASE_URL 需要更新为真实值"
            else
                success "DATABASE_URL 已配置"
            fi
        else
            error ".env 文件缺少 DATABASE_URL"
        fi
    else
        warning ".env 文件不存在，将在首次运行时创建"
    fi
    
    cd ..
else
    error "无法进入 backend 目录"
fi

# 检查前端依赖
echo ""
echo "🎨 检查前端依赖..."
cd frontend 2>/dev/null
if [ $? -eq 0 ]; then
    if [ -d "node_modules" ]; then
        success "前端依赖已安装"
    else
        warning "前端依赖未安装，运行: cd frontend && npm install --legacy-peer-deps"
    fi
    cd ..
else
    error "无法进入 frontend 目录"
fi

# 检查 Git
echo ""
echo "📚 检查 Git 配置..."
if command -v git &> /dev/null; then
    success "Git 已安装"
    
    if [ -d ".git" ]; then
        success "Git 仓库已初始化"
        
        # 检查远程仓库
        if git remote -v | grep -q "origin"; then
            success "Git 远程仓库已配置"
        else
            warning "未配置 Git 远程仓库"
        fi
    else
        warning "当前目录不是 Git 仓库"
    fi
else
    warning "Git 未安装，部署时可能需要"
fi

# 检查 wrangler (Cloudflare CLI)
echo ""
echo "☁️  检查 Cloudflare 工具..."
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version)
    success "Wrangler CLI 已安装: $WRANGLER_VERSION"
else
    warning "Wrangler CLI 未安装，部署时需要: npm install -g wrangler"
fi

# 端口检查
echo ""
echo "🔌 检查端口占用..."
check_port() {
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
            warning "端口 $1 已被占用"
            lsof -Pi :$1 -sTCP:LISTEN | grep LISTEN
        else
            success "端口 $1 可用"
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -an | grep ":$1 " | grep -q "LISTEN"; then
            warning "端口 $1 已被占用"
        else
            success "端口 $1 可用"
        fi
    else
        warning "无法检查端口占用状态"
    fi
}

check_port 3001  # 后端端口
check_port 5173  # 前端端口

# 生成设置报告
echo ""
echo "📋 设置摘要:"
echo "=================="
echo "项目: HotGone - 热点社会事件记忆系统"
echo "架构: React + TypeScript (前端) + Node.js + Express (后端)"
echo "数据库: PostgreSQL (Neon)"
echo "部署: Cloudflare Pages"
echo ""
echo "📝 下一步操作:"
echo "1. 如有依赖缺失，运行相应的安装命令"
echo "2. 配置 Neon 数据库并更新 backend/.env 文件"
echo "3. 运行 './start-dev.sh' 或 'start-dev.bat' 启动开发环境"
echo "4. 访问 http://localhost:5173 查看应用"
echo ""
echo "📚 参考文档:"
echo "- 数据库设置: backend/NEON-SETUP.md"
echo "- 部署指南: CLOUDFLARE-DEPLOYMENT.md"
echo ""
echo "🎉 验证完成！"