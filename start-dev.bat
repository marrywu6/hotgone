@echo off
REM Windows 本地开发环境启动脚本
REM Windows Local Development Environment Setup Script

echo 🚀 启动 HotGone 本地开发环境...
echo 🚀 Starting HotGone Local Development Environment...

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    echo ❌ Node.js not found, please install Node.js first
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM 检查当前目录
if not exist "backend\package.json" (
    echo ❌ 请在项目根目录运行此脚本
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ 请在项目根目录运行此脚本
    echo ❌ Please run this script from the project root directory
    pause
    exit /b 1
)

REM 设置后端
echo 📦 设置后端...
echo 📦 Setting up backend...
cd backend

REM 安装后端依赖
if not exist "node_modules" (
    echo 📥 安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查 .env 文件
if not exist ".env" (
    echo ⚠️  创建 .env 模板文件...
    (
        echo # Neon PostgreSQL Database
        echo DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-ENDPOINT.us-east-1.aws.neon.tech/neondb?sslmode=require"
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # API Keys ^(如果需要^)
        echo # NEWS_API_KEY=your_news_api_key_here
    ) > .env
    echo 📝 请编辑 backend\.env 文件并设置正确的 DATABASE_URL
    echo 📝 Please edit backend\.env file and set correct DATABASE_URL
)

REM Prisma 设置
echo 🗄️  设置数据库...
if exist ".env" (
    REM 生成 Prisma 客户端
    echo 🔧 生成 Prisma 客户端...
    call npx prisma generate
    
    REM 检查数据库连接
    echo 🔍 测试数据库连接...
    node test-db.js >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  数据库连接失败，请检查 DATABASE_URL 设置
        echo ⚠️  Database connection failed, please check DATABASE_URL
    ) else (
        echo ✅ 数据库连接成功
    )
)

cd ..

REM 设置前端
echo 🎨 设置前端...
echo 🎨 Setting up frontend...
cd frontend

REM 安装前端依赖
if not exist "node_modules" (
    echo 📥 安装前端依赖...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
)

cd ..

REM 启动服务
echo 🚀 启动开发服务器...
echo 🚀 Starting development servers...

REM 启动后端
echo 🔧 启动后端 API ^(端口 3001^)...
cd backend
start "Backend API" cmd /k "npm run dev"
echo ✅ 后端启动中...

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
echo 🎨 启动前端开发服务器 ^(端口 5173^)...
cd ..\frontend
start "Frontend Dev Server" cmd /k "npm run dev"
echo ✅ 前端启动中...

REM 等待服务器完全启动
echo ⏳ 等待服务器启动...
timeout /t 5 /nobreak >nul

cd ..

echo.
echo 🎉 开发环境启动完成！
echo 🎉 Development environment is ready!
echo.
echo 📊 服务地址:
echo 📊 Service URLs:
echo    前端 Frontend: http://localhost:5173
echo    后端 Backend:  http://localhost:3001
echo    API文档 API:   http://localhost:3001/api/health
echo.
echo 📝 常用命令:
echo 📝 Common Commands:
echo    手动爬虫: curl -X POST http://localhost:3001/api/crawl/trigger
echo    健康检查: curl http://localhost:3001/api/health
echo    查看事件: curl http://localhost:3001/api/events
echo.
echo 🛑 停止服务: 关闭对应的命令行窗口
echo 🛑 Stop services: Close the respective command windows
echo.
echo 💡 浏览器将在几秒后自动打开...
echo 💡 Browser will open automatically in a few seconds...

REM 等待一下再打开浏览器
timeout /t 3 /nobreak >nul

REM 打开浏览器
start http://localhost:5173

echo.
echo ✅ 完成！按任意键退出此窗口...
echo ✅ Done! Press any key to close this window...
pause >nul