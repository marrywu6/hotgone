import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';

import eventRoutes from './routes/events';
import { crawlEvents } from './services/crawler';
import { updateEventProgress } from './services/updater';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API路由
app.use('/api/events', eventRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel Cron endpoint
app.get('/api/cron/crawl', async (req, res) => {
  try {
    await updateEventProgress();
    res.json({ success: true, message: 'Crawl completed' });
  } catch (error) {
    console.error('Cron crawl failed:', error);
    res.status(500).json({ success: false, error: 'Crawl failed' });
  }
});

// 每天上午9点运行爬虫 (仅在本地环境)
if (process.env.NODE_ENV !== 'production') {
  cron.schedule('0 9 * * *', async () => {
    console.log('Starting scheduled crawl...');
    try {
      await updateEventProgress();
      console.log('Scheduled crawl completed');
    } catch (error) {
      console.error('Scheduled crawl failed:', error);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});