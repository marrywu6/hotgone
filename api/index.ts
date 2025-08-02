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
      await mongoose.connect(process.env.MONGODB_URI!);
      console.log('Connected to MongoDB');
    }

    const { url = '' } = req;
    const path = url.replace('/api', '');

    // 健康检查
    if (path === '/health') {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // 爬虫定时任务
    if (path === '/cron/crawl') {
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
    if (path.startsWith('/events')) {
      const Event = (await import('../backend/src/models/Event')).default;
      
      if (req.method === 'GET') {
        if (path === '/events') {
          const events = await Event.find().sort({ createdAt: -1 }).limit(50);
          res.json({ events });
          return;
        }
        
        if (path.startsWith('/events/search')) {
          const query = req.query.q as string;
          if (!query) {
            res.status(400).json({ error: 'Query parameter required' });
            return;
          }
          
          const events = await Event.find({
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { keywords: { $in: [new RegExp(query, 'i')] } }
            ]
          }).sort({ createdAt: -1 }).limit(20);
          
          res.json(events);
          return;
        }
        
        // 获取单个事件 - 支持 /events/:id 格式
        const idMatch = path.match(/^\/events\/([a-fA-F0-9]{24})$/);
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

    res.status(404).json({ error: 'API endpoint not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}