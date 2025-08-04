import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import eventRoutes from './routes/events';
import { crawlEvents } from './services/crawler';
import { updateEventProgress } from './services/updater';
import { testDatabaseConnection, closeDatabaseConnection } from './lib/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 连接PostgreSQL数据库
testDatabaseConnection()
  .then((connected) => {
    if (connected) {
      console.log('✅ Connected to Neon PostgreSQL database');
    } else {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// API路由
app.use('/api/events', eventRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'postgresql',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cloudflare/Vercel Cron endpoint
app.get('/api/cron/crawl', async (req, res) => {
  try {
    console.log('Starting cron crawl...');
    await updateEventProgress();
    res.json({ success: true, message: 'Crawl completed', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Cron crawl failed:', error);
    res.status(500).json({ success: false, error: 'Crawl failed' });
  }
});

// 手动触发爬虫
app.post('/api/crawl/trigger', async (req, res) => {
  try {
    console.log('Manual crawl triggered...');
    await updateEventProgress();
    res.json({ success: true, message: 'Manual crawl completed', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Manual crawl failed:', error);
    res.status(500).json({ success: false, error: 'Manual crawl failed' });
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
  
  console.log('🕘 Scheduled crawl task registered for 9:00 AM daily');
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Gracefully shutting down...');
  await closeDatabaseConnection();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL (Neon)`);
});