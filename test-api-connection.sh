#!/bin/bash

echo "🧪 启动API连接测试页面..."

# 检查后端是否运行
if curl -s "http://localhost:3001/api/health" > /dev/null; then
    echo "✅ 后端服务器运行正常 (端口3001)"
else
    echo "❌ 后端服务器未运行，请先启动:"
    echo "   cd backend && npm run dev"
    exit 1
fi

# 检查前端是否运行
if curl -s "http://localhost:5173" > /dev/null; then
    echo "✅ 前端服务器运行正常 (端口5173)"
else
    echo "⚠️  前端服务器未运行，建议启动:"
    echo "   cd frontend && npm run dev"
fi

echo ""
echo "🌐 打开测试页面..."
echo "   API测试页面: file://$(pwd)/api-test.html"
echo "   前端应用: http://localhost:5173"
echo "   后端API: http://localhost:3001/api/health"
echo ""

# 在Windows上打开HTML文件
if command -v cmd.exe &> /dev/null; then
    cmd.exe /c start "$(pwd)/api-test.html"
elif command -v xdg-open &> /dev/null; then
    xdg-open "api-test.html"
else
    echo "请手动打开: $(pwd)/api-test.html"
fi

echo "🔍 测试页面功能:"
echo "   1. 测试后端连接状态"
echo "   2. 查看热点事件列表" 
echo "   3. 测试爬虫触发功能"