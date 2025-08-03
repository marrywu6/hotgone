# 热点社会事件爬虫功能使用说明

## 功能概述

爬虫功能已经完善，专门针对你提到的热点社会事件进行监控和分析，包括：
- **黄杨耳环事件**：地铁偷拍隐私保护事件
- **哈佛蒋**：哈佛相关学术争议事件  
- **协和董**：协和医学院教育争议事件
- **武大杨景媛**：武汉大学师生关系事件
- **董宇辉东方甄选**：直播带货商业争议事件

## 启动方式

### 手动运行爬虫
```bash
cd backend
npm run crawler
```

### 查看热点事件
访问API端点获取数据：
- 所有事件：`GET /api/events`
- 热点排行：`GET /api/events/hot/ranking`
- 事件详情：`GET /api/events/:id`
- 事件脉络：`GET /api/events/:id/context`
- 事件摘要：`GET /api/events/:id/summary`

## 核心功能特色

### 1. 智能关键词识别
针对具体热点人物和事件进行精准识别：
- 直接人名识别：武大杨景媛、协和董、黄杨、董宇辉等
- 机构识别：协和医学院、武汉大学、东方甄选等
- 事件类型：师生关系、医学教育、隐私保护、直播带货等

### 2. 完整事件脉络分析
为每个事件提供：
- **背景介绍**：事件的起因和社会背景
- **关键人物**：涉及的主要当事人
- **时间线**：按时间顺序的事件发展过程
- **社会影响**：对相关领域的影响分析
- **公众反应**：社会各界的反响和讨论
- **当前状态**：事件的最新处理状态

### 3. 多维度重要性评估
基于以下因素计算事件重要性：
- 热度数值（点击量、讨论量等）
- 关键词匹配度（特别是热点人物和事件）
- 来源权威性（官方媒体vs社交平台）
- 社会影响范围
- 持续关注时间

### 4. 智能去重和相似度匹配
避免同一事件重复记录：
- 标题相似度检测
- 关键词交集分析
- 时间窗口内的事件合并
- 多来源信息整合

## 数据来源

当前集成的数据源包括：
- **微博热搜**：实时社会热点话题
- **百度热搜**：综合搜索热度数据
- **知乎热榜**：深度讨论和分析内容
- **今日头条**：新闻资讯热点
- **第三方新闻API**：官方媒体报道

## API 接口详情

### 基础事件查询（支持日期过滤）
```
GET /api/events
```
支持的查询参数：
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `status`: 事件状态过滤（active/resolved/ongoing）
- `category`: 事件分类过滤
- `startDate`: 开始日期（YYYY-MM-DD格式）
- `endDate`: 结束日期（YYYY-MM-DD格式）
- `date`: 特定日期（YYYY-MM-DD格式）
- `sortBy`: 排序字段（updatedAt/createdAt/importance/title）
- `sortOrder`: 排序方向（desc/asc）

示例：
```
# 获取2024年3月1日到3月10日的事件，按重要性降序排列
GET /api/events?startDate=2024-03-01&endDate=2024-03-10&sortBy=importance&sortOrder=desc

# 获取2024年2月15日的所有事件
GET /api/events?date=2024-02-15
```

### 特定日期事件查询
```
GET /api/events/by-date/:date
```
获取指定日期的所有事件，支持排序。

示例：
```
GET /api/events/by-date/2024-03-01?sortBy=importance&sortOrder=desc
```

返回格式：
```json
{
  "date": "2024-03-01",
  "events": [
    {
      "_id": "3",
      "title": "武汉大学杨景媛事件",
      "description": "武汉大学相关人员行为不当事件引发讨论",
      "category": "高等教育",
      "status": "active",
      "importance": 6,
      "keywords": ["武汉大学", "杨景媛", "师生关系"],
      "createdAt": "2024-03-01T00:00:00.000Z",
      "updatedAt": "2024-03-05T00:00:00.000Z"
    }
  ],
  "total": 1,
  "summary": "2024-03-01 共找到 1 个相关事件"
}
```

### 日期范围查询
```
GET /api/events/date-range
```
查询参数：
- `startDate`: 开始日期（必需，YYYY-MM-DD格式）
- `endDate`: 结束日期（必需，YYYY-MM-DD格式）
- `limit`: 限制返回数量（默认50）
- `sortBy`: 排序字段（默认updatedAt）
- `sortOrder`: 排序方向（默认desc）

示例：
```
GET /api/events/date-range?startDate=2024-01-15&endDate=2024-02-15&sortBy=importance
```

返回格式：
```json
{
  "dateRange": {
    "startDate": "2024-01-15",
    "endDate": "2024-02-15",
    "days": 31
  },
  "events": [...],
  "statistics": {
    "total": 3,
    "returned": 3,
    "byDate": {
      "2024-01-20": 1,
      "2024-02-01": 1,
      "2024-02-15": 1
    },
    "categories": {
      "教育医疗": 1,
      "社会安全": 2
    }
  }
}
```

### 月份日历视图
```
GET /api/events/calendar/:year/:month
```
获取指定年月的事件日历，按日期分组显示。

示例：
```
GET /api/events/calendar/2024/3
```

返回格式：
```json
{
  "year": 2024,
  "month": 3,
  "monthName": "三月",
  "totalEvents": 2,
  "calendar": [
    {
      "day": 1,
      "date": "2024-03-01",
      "eventCount": 1,
      "events": [
        {
          "_id": "5",
          "title": "董宇辉东方甄选商业模式争议",
          "category": "商业经济",
          "importance": 7
        }
      ],
      "hasMore": false
    },
    {
      "day": 2,
      "date": "2024-03-02",
      "eventCount": 0,
      "events": [],
      "hasMore": false
    }
    // ... 其他日期
  ],
  "summary": {
    "mostActiveDay": "1",
    "categoriesThisMonth": {
      "商业经济": 1,
      "高等教育": 1
    }
  }
}
```

### 获取热点事件榜单
```
GET /api/events/hot/ranking?limit=10
```
返回按重要性和热度排序的热点事件列表。

### 获取事件完整脉络
```
GET /api/events/:id/context
```
返回包含以下信息的完整事件分析：
```json
{
  "event": {
    "_id": "事件ID",
    "title": "事件标题",
    "description": "事件描述",
    "category": "事件分类",
    "status": "事件状态",
    "importance": 8,
    "keywords": ["关键词列表"],
    "sources": ["来源链接"],
    "createdAt": "创建时间",
    "updatedAt": "更新时间"
  },
  "context": {
    "background": "事件背景",
    "keyPersons": ["关键人物"],
    "timeline": [
      {
        "date": "时间",
        "title": "标题", 
        "content": "内容",
        "type": "类型",
        "importance": 重要性评分
      }
    ],
    "impact": ["社会影响"],
    "publicReaction": ["公众反应"],
    "currentStatus": "当前状态"
  }
}
```

### 生成事件摘要报告
```
GET /api/events/:id/summary
```
返回结构化的事件摘要，一目了然展示事件的前因后果。

## 使用建议

1. **定期运行爬虫**：建议每日运行1-2次，确保数据及时更新
2. **关注热点排行**：通过 `/hot/ranking` 接口快速了解当前最受关注的事件
3. **深度分析重要事件**：对高重要性事件使用 `/context` 和 `/summary` 获取详细分析
4. **追踪事件发展**：定期查看事件状态变化和时间线更新
5. **按日期检索历史事件**：
   - 使用 `/by-date/YYYY-MM-DD` 查看特定日期的事件
   - 使用 `/date-range` 查看一段时间内的事件趋势
   - 使用 `/calendar/YYYY/MM` 获取月度事件概览
6. **灵活排序和筛选**：支持按重要性、时间、标题等多维度排序

## 日期检索使用示例

### 查看今日热点事件
```bash
curl "http://localhost:3001/api/events/by-date/2024-03-01"
```

### 查看本周事件趋势
```bash
curl "http://localhost:3001/api/events/date-range?startDate=2024-02-26&endDate=2024-03-03&sortBy=importance"
```

### 查看本月事件日历
```bash
curl "http://localhost:3001/api/events/calendar/2024/3"
```

### 按日期过滤热点事件
```bash
curl "http://localhost:3001/api/events?startDate=2024-03-01&endDate=2024-03-10&sortBy=importance&sortOrder=desc"
```

### 查看历史上的今天
```bash
curl "http://localhost:3001/api/events?date=2024-02-15&sortBy=updatedAt"
```

## 技术特点

- ✅ **高精度识别**：专门针对你关注的热点人物和事件优化
- ✅ **完整脉络梳理**：从事件起因到发展过程，一目了然
- ✅ **智能数据聚合**：多平台数据整合，信息更全面
- ✅ **实时更新跟踪**：持续监控事件发展，及时更新时间线
- ✅ **结构化存储**：便于后续查阅和分析
- ✅ **灵活的API接口**：支持多种查询和分析需求
- ✅ **强大的日期检索**：支持按日期、日期范围、月历等多种时间维度查询
- ✅ **多维度排序**：按重要性、时间、分类等灵活排序
- ✅ **统计分析功能**：提供事件统计和趋势分析

## 新增日期检索功能特色

🗓️ **全面的时间检索支持**：
- **特定日期查询**：精确查找某一天发生的所有事件
- **日期范围查询**：查看一段时间内的事件发展趋势
- **月份日历视图**：以日历形式展示整月的事件分布
- **智能日期过滤**：在基础查询中加入灵活的日期筛选

📊 **丰富的统计信息**：
- 按日期分组的事件统计
- 分类别的事件分布
- 最活跃日期识别
- 时间范围内的趋势分析

🔍 **便捷的使用方式**：
- 支持标准YYYY-MM-DD日期格式
- 多种排序和过滤选项
- 清晰的响应数据结构
- 友好的错误提示和参数验证

现在你可以通过这个系统轻松追踪和了解这些重要社会事件的完整发展脉络，并且可以按日期检索历史事件，方便回顾和研究特定时间段的社会热点！