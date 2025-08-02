// Cloudflare Pages 函数配置
export const onRequest: PagesFunction = async (context) => {
  return await handleRequest(context.request, context.env);
};

// 静态示例数据 - 确保即使数据库不可用也能返回数据
const SAMPLE_EVENTS = [
  {
    _id: "sample1",
    title: "2024年人工智能技术突破",
    description: "GPT-4、Claude等大语言模型的重大技术突破，推动AI在各行业的应用普及，改变工作方式和生产效率。",
    category: "科技",
    status: "active",
    timeline: [
      {
        _id: "t1",
        date: "2024-01-15",
        title: "GPT-4 Turbo发布",
        content: "OpenAI发布GPT-4 Turbo，性能提升显著，成本降低",
        type: "development"
      },
      {
        _id: "t2", 
        date: "2024-03-01",
        title: "Claude 3发布",
        content: "Anthropic发布Claude 3系列模型，在多项基准测试中表现优异",
        type: "development"
      }
    ],
    sources: ["https://openai.com", "https://anthropic.com"],
    keywords: ["人工智能", "GPT-4", "Claude", "大语言模型"],
    importance: 9,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-03-01T00:00:00.000Z"
  },
  {
    _id: "sample2",
    title: "全球气候变化加剧",
    description: "2024年全球平均气温再创新高，极端天气事件频发，国际社会加强气候行动合作。",
    category: "环境",
    status: "ongoing",
    timeline: [
      {
        _id: "t3",
        date: "2024-02-01",
        title: "联合国气候报告",
        content: "联合国发布最新气候变化报告，警告全球变暖趋势加速",
        type: "incident"
      },
      {
        _id: "t4",
        date: "2024-06-15",
        title: "极端高温事件",
        content: "多地出现创纪录高温，引发全球对气候变化的关注",
        type: "incident"
      }
    ],
    sources: ["https://unfccc.int", "https://ipcc.ch"],
    keywords: ["气候变化", "全球变暖", "极端天气", "环境保护"],
    importance: 10,
    createdAt: "2024-02-01T00:00:00.000Z",
    updatedAt: "2024-06-15T00:00:00.000Z"
  },
  {
    _id: "sample3",
    title: "全球经济复苏与挑战",
    description: "2024年全球经济在后疫情时代逐步复苏，但面临通胀、供应链等多重挑战。",
    category: "经济",
    status: "active",
    timeline: [
      {
        _id: "t5",
        date: "2024-01-20",
        title: "IMF经济预测",
        content: "国际货币基金组织发布2024年全球经济展望",
        type: "development"
      },
      {
        _id: "t6",
        date: "2024-04-10",
        title: "美联储政策调整",
        content: "美联储调整货币政策，影响全球经济走向",
        type: "development"
      }
    ],
    sources: ["https://imf.org", "https://worldbank.org"],
    keywords: ["经济复苏", "通胀", "货币政策", "GDP"],
    importance: 8,
    createdAt: "2024-01-20T00:00:00.000Z",
    updatedAt: "2024-04-10T00:00:00.000Z"
  },
  {
    _id: "sample4",
    title: "太空探索新进展",
    description: "2024年各国太空探索项目取得重大进展，商业太空旅游蓬勃发展。",
    category: "科技",
    status: "active",
    timeline: [
      {
        _id: "t7",
        date: "2024-03-15",
        title: "嫦娥六号发射",
        content: "中国成功发射嫦娥六号月球探测器",
        type: "development"
      },
      {
        _id: "t8",
        date: "2024-05-20",
        title: "SpaceX新突破",
        content: "SpaceX成功完成载人太空任务，推进商业太空发展",
        type: "development"
      }
    ],
    sources: ["https://nasa.gov", "https://spacex.com"],
    keywords: ["太空探索", "嫦娥六号", "SpaceX", "商业太空"],
    importance: 7,
    createdAt: "2024-03-15T00:00:00.000Z",
    updatedAt: "2024-05-20T00:00:00.000Z"
  },
  {
    _id: "sample5",
    title: "新能源汽车市场爆发",
    description: "2024年全球新能源汽车销量大幅增长，充电基础设施建设加速，传统车企加速转型。",
    category: "科技",
    status: "active",
    timeline: [
      {
        _id: "t9",
        date: "2024-02-28",
        title: "特斯拉销量突破",
        content: "特斯拉2024年Q1销量创新高",
        type: "development"
      },
      {
        _id: "t10",
        date: "2024-04-05",
        title: "充电网络扩张",
        content: "全球充电桩数量突破500万个里程碑",
        type: "development"
      }
    ],
    sources: ["https://tesla.com", "https://iea.org"],
    keywords: ["新能源汽车", "电动汽车", "充电桩", "绿色出行"],
    importance: 8,
    createdAt: "2024-02-28T00:00:00.000Z",
    updatedAt: "2024-04-05T00:00:00.000Z"
  }
];

// Neon PostgreSQL数据库连接（免费大容量数据库）
async function connectToNeon(env: any) {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not configured');
  }
  
  // 使用Neon的HTTP API进行查询
  // Neon PostgreSQL提供REST API，完美适配Cloudflare Workers
  console.log('Connecting to Neon PostgreSQL...');
  
  const response = await fetch(env.DATABASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DATABASE_TOKEN || ''}`
    },
    body: JSON.stringify({
      query: `
        SELECT 
          e.id as _id,
          e.title,
          e.description,
          e.category,
          e.status,
          e.importance,
          e.keywords,
          e.sources,
          e.created_at as "createdAt",
          e.updated_at as "updatedAt",
          COALESCE(
            json_agg(
              json_build_object(
                '_id', t.id,
                'date', t.date,
                'title', t.title,
                'content', t.content,
                'type', t.type
              ) ORDER BY t.date
            ) FILTER (WHERE t.id IS NOT NULL), 
            '[]'::json
          ) as timeline
        FROM events e
        LEFT JOIN event_timeline t ON e.id = t.event_id
        GROUP BY e.id, e.title, e.description, e.category, e.status, e.importance, e.keywords, e.sources, e.created_at, e.updated_at
        ORDER BY e.created_at DESC
        LIMIT 50
      `
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database query failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.rows || [];
}

// 主要的API处理函数
async function handleRequest(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // CORS设置
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] ${request.method} ${path}`);

  try {
    // 健康检查端点
    if (path === '/api/health' || path === '/health') {
      let dbStatus = 'disconnected';
      let dbError = null;
      
      try {
        await connectToNeon(env);
        dbStatus = 'connected';
      } catch (error) {
        dbError = error.message;
      }
      
      const response = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbStatus,
        error: dbError,
        processing_time: `${Date.now() - startTime}ms`
      };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 事件列表端点 - 优先返回数据
    if (path === '/api/events' || path === '/events') {
      console.log('Fetching events list...');
      
      // 首先返回示例数据（确保有响应）
      let events = [...SAMPLE_EVENTS];
      let dataSource = 'sample';
      
      // 尝试从数据库获取真实数据（非阻塞）
      try {
        const dbEvents = await connectToNeon(env);
        if (dbEvents && dbEvents.length > 0) {
          events = dbEvents;
          dataSource = 'database';
          console.log(`Found ${dbEvents.length} events from database`);
        }
      } catch (dbError) {
        console.error('Database error, using sample data:', dbError.message);
      }
      
      const response = { 
        events,
        meta: {
          count: events.length,
          source: dataSource,
          processing_time: `${Date.now() - startTime}ms`,
          timestamp: new Date().toISOString()
        }
      };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 搜索端点
    if (path.startsWith('/api/events/search') || path.startsWith('/events/search')) {
      const searchQuery = url.searchParams.get('q');
      if (!searchQuery) {
        return new Response(JSON.stringify({ error: 'Query parameter required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log('Searching events for:', searchQuery);
      
      // 在示例数据中搜索
      const filteredEvents = SAMPLE_EVENTS.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      return new Response(JSON.stringify(filteredEvents), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 单个事件端点
    const idMatch = path.match(/^\/api\/events\/([a-zA-Z0-9]+)$/) || path.match(/^\/events\/([a-zA-Z0-9]+)$/);
    if (idMatch) {
      const eventId = idMatch[1];
      console.log('Fetching event by ID:', eventId);
      
      // 在示例数据中查找
      const event = SAMPLE_EVENTS.find(event => event._id === eventId);
      if (event) {
        return new Response(JSON.stringify(event), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 其他端点
    const response = { 
      error: 'API endpoint not found', 
      path: path,
      availableEndpoints: ['/api/health', '/api/events', '/api/events/search', '/api/events/:id'],
      processing_time: `${Date.now() - startTime}ms`
    };
    
    return new Response(JSON.stringify(response), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    const response = { 
      error: 'Internal server error', 
      details: error.message,
      processing_time: `${Date.now() - startTime}ms`
    };
    
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// 类型定义
interface PagesFunction {
  (context: { request: Request; env: any }): Promise<Response>;
}