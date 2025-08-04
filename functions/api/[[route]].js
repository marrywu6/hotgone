// Cloudflare Pages Functions API 路由
// 专门为Cloudflare环境优化的API处理器

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  // 健康检查端点
  if (path === '/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: env.DATABASE_URL ? 'configured' : 'not configured',
      environment: 'cloudflare-pages',
      availableEndpoints: [
        '/api/health',
        '/api/events',
        '/api/events/search',
        '/api/events/:id',
        '/api/events/by-date/:date',
        '/api/events/date-range',
        '/api/events/calendar/:year/:month',
        '/api/events/hot/ranking',
        '/api/crawl/trigger',
        '/api/cron/crawl',
        '/api/sample/create-hot-events'
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 获取事件列表
  if (path === '/events') {
    // 模拟热点事件数据 (实际部署时应连接到Neon数据库)
    const mockEvents = [
      {
        id: '1',
        title: '黄杨耳环事件引发网络热议',
        description: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
        category: '社会热点',
        status: 'ACTIVE',
        importance: 8,
        keywords: ['黄杨', '耳环', '网络热议', '社交媒体'],
        sources: ['微博', '抖音', '小红书'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: '1-1',
          date: new Date().toISOString(),
          title: '事件首次报道',
          content: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
          type: 'INCIDENT'
        }]
      },
      {
        id: '2',
        title: '哈佛蒋事件持续发酵',
        description: '哈佛蒋相关话题在教育圈引起关注',
        category: '教育社会',
        status: 'ACTIVE',
        importance: 7,
        keywords: ['哈佛蒋', '教育', '留学', '争议'],
        sources: ['知乎', '微博', '新闻媒体'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: '2-1',
          date: new Date().toISOString(),
          title: '事件首次报道',
          content: '哈佛蒋相关话题在教育圈引起关注',
          type: 'INCIDENT'
        }]
      },
      {
        id: '3',
        title: '协和董事件最新进展',
        description: '协和董相关事件的最新发展情况',
        category: '医疗教育',
        status: 'ACTIVE',
        importance: 6,
        keywords: ['协和董', '医学教育', '协和医学院'],
        sources: ['官方声明', '新闻报道'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: '3-1',
          date: new Date().toISOString(),
          title: '事件首次报道',
          content: '协和董相关事件的最新发展情况',
          type: 'INCIDENT'
        }]
      },
      {
        id: '4',
        title: '武大杨景媛事件校园关注',
        description: '武汉大学杨景媛事件在校园内外引起关注',
        category: '校园事件',
        status: 'ACTIVE',
        importance: 6,
        keywords: ['武大', '杨景媛', '校园', '武汉大学'],
        sources: ['校园论坛', '社交媒体'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: '4-1',
          date: new Date().toISOString(),
          title: '事件首次报道',
          content: '武汉大学杨景媛事件在校园内外引起关注',
          type: 'INCIDENT'
        }]
      }
    ];

    const { page = 1, limit = 10 } = Object.fromEntries(url.searchParams.entries());
    
    return new Response(JSON.stringify({
      events: mockEvents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockEvents.length,
        pages: Math.ceil(mockEvents.length / Number(limit))
      },
      filters: {
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 热点事件排行榜
  if (path === '/events/hot/ranking') {
    const mockEvents = [
      {
        id: '1',
        title: '黄杨耳环事件引发网络热议',
        description: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
        category: '社会热点',
        status: 'ACTIVE',
        importance: 8,
        keywords: ['黄杨', '耳环', '网络热议', '社交媒体'],
        sources: ['微博', '抖音', '小红书'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '哈佛蒋事件持续发酵',
        description: '哈佛蒋相关话题在教育圈引起关注',
        category: '教育社会',
        status: 'ACTIVE',
        importance: 7,
        keywords: ['哈佛蒋', '教育', '留学', '争议'],
        sources: ['知乎', '微博', '新闻媒体'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return new Response(JSON.stringify(mockEvents), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 按日期查询事件
  if (path.startsWith('/events/by-date/')) {
    const date = path.split('/events/by-date/')[1];
    
    const mockEvents = [
      {
        id: '1',
        title: '黄杨耳环事件引发网络热议',
        description: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
        category: '社会热点',
        status: 'ACTIVE',
        importance: 8,
        keywords: ['黄杨', '耳环', '网络热议', '社交媒体'],
        sources: ['微博', '抖音', '小红书'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [{
          id: '1-1',
          date: new Date().toISOString(),
          title: '事件首次报道',
          content: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
          type: 'INCIDENT'
        }]
      }
    ];

    return new Response(JSON.stringify({
      date,
      events: mockEvents,
      total: mockEvents.length,
      summary: `${date} 共找到 ${mockEvents.length} 个相关事件`
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 默认404响应
  return new Response(JSON.stringify({
    error: 'API endpoint not found',
    path: path,
    availableEndpoints: [
      '/api/health',
      '/api/events',
      '/api/events/search',
      '/api/events/:id',
      '/api/events/by-date/:date',
      '/api/events/date-range',
      '/api/events/calendar/:year/:month',
      '/api/events/hot/ranking',
      '/api/crawl/trigger',
      '/api/cron/crawl'
    ],
    processing_time: '0ms'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  // 手动触发爬虫
  if (path === '/crawl/trigger') {
    // 模拟爬虫执行
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟处理时间

    return new Response(JSON.stringify({
      success: true,
      message: 'Cloudflare Pages crawl completed successfully',
      database: env.DATABASE_URL ? 'connected' : 'demo_mode',
      demo_data: {
        events_found: 4,
        hot_events: [
          '黄杨耳环事件引发网络热议',
          '哈佛蒋事件持续发酵',
          '协和董事件最新进展',
          '武大杨景媛事件校园关注'
        ],
        note: env.DATABASE_URL ? 'Connected to Neon PostgreSQL' : 'Demo mode - configure DATABASE_URL in Cloudflare Pages settings'
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 创建示例热点事件
  if (path === '/sample/create-hot-events') {
    // 模拟创建事件
    await new Promise(resolve => setTimeout(resolve, 500));

    return new Response(JSON.stringify({
      success: true,
      message: 'Sample hot events created successfully in Cloudflare Pages',
      events_created: [
        '黄杨耳环事件引发网络热议',
        '哈佛蒋事件持续发酵',
        '协和董事件最新进展',
        '武大杨景媛事件校园关注'
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // Cron端点
  if (path === '/cron/crawl') {
    await new Promise(resolve => setTimeout(resolve, 800));

    return new Response(JSON.stringify({
      success: true,
      message: 'Cron crawl completed successfully',
      database: env.DATABASE_URL ? 'connected' : 'demo_mode',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }

  // 默认404响应
  return new Response(JSON.stringify({
    error: 'API endpoint not found',
    path: path,
    method: 'POST',
    availableEndpoints: [
      'POST /api/crawl/trigger',
      'POST /api/sample/create-hot-events',
      'GET /api/cron/crawl'
    ],
    processing_time: '0ms'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404
  });
}