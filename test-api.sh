#!/bin/bash

# 测试爬虫API端点的脚本
echo "🧪 Testing HotGone API Endpoints..."

# 服务器地址
BASE_URL="http://localhost:3001"

echo ""
echo "1. 测试健康检查端点..."
curl -s "$BASE_URL/api/health" | python3 -m json.tool || echo "Health check failed"

echo ""
echo "2. 测试手动触发爬虫端点..."
curl -X POST -s "$BASE_URL/api/crawl/trigger" | python3 -m json.tool || echo "Crawl trigger failed"

echo ""
echo "3. 测试创建示例热点事件端点..."
curl -X POST -s "$BASE_URL/api/sample/create-hot-events" | python3 -m json.tool || echo "Sample events creation failed"

echo ""
echo "4. 测试获取事件列表端点..."
curl -s "$BASE_URL/api/events" | python3 -m json.tool || echo "Events list failed"

echo ""
echo "5. 测试热点事件排行榜端点..."
curl -s "$BASE_URL/api/events/hot/ranking" | python3 -m json.tool || echo "Hot ranking failed"

echo ""
echo "6. 测试搜索端点..."
curl -s "$BASE_URL/api/events/search?q=黄杨" | python3 -m json.tool || echo "Search failed"

echo ""
echo "7. 测试按日期查询端点..."
curl -s "$BASE_URL/api/events/by-date/2024-08-04" | python3 -m json.tool || echo "Date query failed"

echo ""
echo "8. 测试日期范围查询端点..."
curl -s "$BASE_URL/api/events/date-range?startDate=2024-08-01&endDate=2024-08-04" | python3 -m json.tool || echo "Date range query failed"

echo ""
echo "9. 测试月度日历端点..."
curl -s "$BASE_URL/api/events/calendar/2024/8" | python3 -m json.tool || echo "Calendar query failed"

echo ""
echo "✅ API端点测试完成！"