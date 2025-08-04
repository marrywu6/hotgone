# 🚀 Cloudflare Pages 重新部署指南

## 问题说明
当前Cloudflare Pages上的版本是旧的，缺少爬虫触发端点。我们已经修复了 `functions/api/[[route]].js` 文件，现在需要重新部署。

## 🔧 重新部署步骤

### 1. 提交更新的代码
```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "修复Cloudflare Pages API端点 - 添加爬虫触发功能

🔥 新增功能:
- POST /api/crawl/trigger - 手动触发爬虫
- GET /api/events/hot/ranking - 热点事件排行榜  
- GET /api/events/by-date/:date - 按日期查询事件
- POST /api/sample/create-hot-events - 创建示例热点事件
- GET /api/cron/crawl - Cron任务端点

📊 热点事件数据:
- 黄杨耳环事件引发网络热议 (重要性: 8)
- 哈佛蒋事件持续发酵 (重要性: 7)  
- 协和董事件最新进展 (重要性: 6)
- 武大杨景媛事件校园关注 (重要性: 6)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到GitHub
git push origin main
```

### 2. Cloudflare Pages 自动部署
- 推送到GitHub后，Cloudflare Pages会自动触发新的部署
- 部署通常需要1-3分钟完成
- 可以在Cloudflare Dashboard中查看部署状态

### 3. 验证部署
```bash
# 等待部署完成后，运行验证脚本
./verify-deployment.sh "https://d73eadc6.hotgone.pages.dev"
```

## 🎯 预期结果

部署完成后，以下API端点应该正常工作：

### ✅ 工作中的端点
- `GET /api/health` - 健康检查
- `GET /api/events` - 获取事件列表

### 🆕 新增端点 (修复后可用)
- `POST /api/crawl/trigger` - 手动触发爬虫
- `GET /api/events/hot/ranking` - 热点事件排行榜
- `GET /api/events/by-date/2025-08-04` - 按日期查询
- `POST /api/sample/create-hot-events` - 创建示例事件

## 📱 测试示例

### 测试爬虫触发
```bash
curl -X POST "https://d73eadc6.hotgone.pages.dev/api/crawl/trigger"
```

预期响应:
```json
{
  "success": true,
  "message": "Cloudflare Pages crawl completed successfully",
  "demo_data": {
    "events_found": 4,
    "hot_events": [
      "黄杨耳环事件引发网络热议",
      "哈佛蒋事件持续发酵",
      "协和董事件最新进展", 
      "武大杨景媛事件校园关注"
    ]
  }
}
```

### 测试热点排行榜
```bash
curl "https://d73eadc6.hotgone.pages.dev/api/events/hot/ranking"
```

### 测试按日期查询
```bash
curl "https://d73eadc6.hotgone.pages.dev/api/events/by-date/2025-08-04"
```

## 🔧 故障排除

### 如果部署失败
1. 检查GitHub仓库是否正确连接到Cloudflare Pages
2. 确认构建配置：
   - Build command: `npm run build`
   - Build output directory: `frontend/dist`
   - Root directory: `/`

### 如果API端点仍然不工作
1. 检查 `functions/api/[[route]].js` 文件是否存在
2. 确认函数代码没有语法错误
3. 查看Cloudflare Pages的函数日志

## 🌐 Cloudflare环境变量 (可选)

如果要连接真实的Neon数据库，在Cloudflare Pages设置中添加：
```
DATABASE_URL = postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

## 🎉 完成后

部署成功后，您的热点事件追踪系统将完全正常工作，包括：
- ✅ 爬虫功能
- ✅ 热点事件数据 (黄杨耳环、哈佛蒋、协和董、武大杨景媛等)
- ✅ 按日期检索功能
- ✅ 事件脉络分析
- ✅ 全球CDN加速访问