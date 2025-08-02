import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// 处理所有API请求的主函数
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 连接MongoDB
    if (!mongoose.connection.readyState) {
      if (!process.env.MONGODB_URI) {
        res.status(500).json({ error: 'MongoDB URI not configured' });
        return;
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }

    // 更好的路径解析
    const { url = '', query } = req;
    console.log('Request URL:', url, 'Method:', req.method);
    
    // 规范化路径处理
    let path = url;
    if (path.startsWith('/api/')) {
      path = path.substring(4); // 移除 '/api'
    } else if (path.startsWith('/api')) {
      path = path.substring(4); // 移除 '/api'
    }
    
    console.log('Processed path:', path);

    // 健康检查
    if (path === '/health' || path === 'health') {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
      return;
    }

    // 爬虫定时任务
    if (path === '/cron/crawl' || path === 'cron/crawl') {
      try {
        const { crawlEvents } = await import('../backend/src/services/crawler');
        await crawlEvents();
        res.json({ success: true, message: 'Crawl completed' });
      } catch (error) {
        console.error('Crawl error:', error);
        res.json({ success: true, message: 'Crawl skipped - service not available' });
      }
      return;
    }

    // 事件相关API
    if (path.startsWith('/events') || path.startsWith('events')) {
      const Event = (await import('../backend/src/models/Event')).default;
      
      if (req.method === 'GET') {
        if (path === '/events' || path === 'events') {
          console.log('Fetching events...');
          const events = await Event.find().sort({ createdAt: -1 }).limit(50);
          console.log('Found events:', events.length);
          
          // 如果数据库中没有事件，创建一些测试数据
          if (events.length === 0) {
            console.log('No events found, creating sample data...');
            const sampleEvents = [
              {
                title: "2024年技术趋势分析",
                description: "人工智能、云计算、物联网等技术的最新发展趋势和前景分析。",
                category: "科技",
                status: "active",
                timeline: [
                  {
                    date: new Date('2024-01-15'),
                    title: "AI技术突破",
                    content: "GPT-4和其他大语言模型的重大进展",
                    type: "development"
                  }
                ],
                sources: ["https://example.com/tech-trends"],
                keywords: ["人工智能", "云计算", "物联网", "技术趋势"],
                importance: 8
              },
              {
                title: "全球气候变化最新报告",
                description: "联合国发布的气候变化报告显示全球温度持续上升的趋势。",
                category: "环境",
                status: "ongoing",
                timeline: [
                  {
                    date: new Date('2024-02-01'),
                    title: "报告发布",
                    content: "联合国气候变化报告正式发布",
                    type: "incident"
                  }
                ],
                sources: ["https://example.com/climate-report"],
                keywords: ["气候变化", "全球变暖", "环境保护"],
                importance: 9
              },
              {
                title: "经济复苏与挑战",
                description: "全球经济在疫情后的复苏进程及面临的主要挑战分析。",
                category: "经济",
                status: "active",
                timeline: [
                  {
                    date: new Date('2024-01-20'),
                    title: "经济数据发布",
                    content: "最新的GDP增长数据显示经济复苏迹象",
                    type: "development"
                  }
                ],
                sources: ["https://example.com/economy-recovery"],
                keywords: ["经济复苏", "GDP", "就业", "通胀"],
                importance: 7
              }
            ];
            
            await Event.insertMany(sampleEvents);
            console.log('Sample data created');
            
            // 重新获取事件
            const newEvents = await Event.find().sort({ createdAt: -1 }).limit(50);
            res.json({ events: newEvents });
            return;
          }
          
          res.json({ events });
          return;
        }
        
        if (path.startsWith('/events/search') || path.startsWith('events/search')) {
          const searchQuery = query.q as string;
          if (!searchQuery) {
            res.status(400).json({ error: 'Query parameter required' });
            return;
          }
          
          const events = await Event.find({
            $or: [
              { title: { $regex: searchQuery, $options: 'i' } },
              { description: { $regex: searchQuery, $options: 'i' } },
              { keywords: { $in: [new RegExp(searchQuery, 'i')] } }
            ]
          }).sort({ createdAt: -1 }).limit(20);
          
          res.json(events);
          return;
        }
        
        // 获取单个事件 - 支持 /events/:id 格式
        const idMatch = path.match(/^\/events\/([a-fA-F0-9]{24})$/) || path.match(/^events\/([a-fA-F0-9]{24})$/);
        if (idMatch) {
          const eventId = idMatch[1];
          const event = await Event.findById(eventId);
          if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
          }
          res.json(event);
          return;
        }
      }
    }

    // 如果没有匹配的路由，返回404
    console.log('No route matched for path:', path);
    res.status(404).json({ 
      error: 'API endpoint not found', 
      path: path,
      url: url,
      availableEndpoints: ['/health', '/events', '/events/search', '/cron/crawl']
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}