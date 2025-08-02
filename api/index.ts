import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import mongoose from 'mongoose';
import eventRoutes from '../backend/src/routes/events';
import express from 'express';

const app = express();

// CORS配置
app.use(cors());
app.use(express.json());

// 连接MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// API路由
app.use('/api/events', eventRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 爬虫定时任务端点
app.get('/api/cron/crawl', async (req, res) => {
  try {
    const { crawlEvents } = await import('../backend/src/services/crawler');
    await crawlEvents();
    res.json({ success: true, message: 'Crawl completed' });
  } catch (error) {
    console.error('Crawl error:', error);
    res.status(500).json({ success: false, error: 'Crawl failed' });
  }
});

export default app;