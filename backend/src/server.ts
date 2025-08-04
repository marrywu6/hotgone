import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import eventRoutes from './routes/events';
import { crawlEvents } from './services/crawler';
import { updateEventProgress, createSampleHotEvents } from './services/updater';
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
      console.warn('⚠️  Database connection failed, running in demo mode');
      console.warn('⚠️  Please configure DATABASE_URL in .env for full functionality');
    }
  })
  .catch(err => {
    console.warn('⚠️  Database connection error:', err.message);
    console.warn('⚠️  Running in demo mode - please configure DATABASE_URL in .env');
  });

// API路由
app.use('/api/events', eventRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'postgresql',
    environment: process.env.NODE_ENV || 'development',
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
  });
});

// Cloudflare/Vercel Cron endpoint
app.get('/api/cron/crawl', async (req, res) => {
  try {
    console.log('🕐 Starting cron crawl...');
    await updateEventProgress();
    res.json({ 
      success: true, 
      message: 'Crawl completed successfully', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('❌ Cron crawl failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Crawl failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 手动触发爬虫
app.post('/api/crawl/trigger', async (req, res) => {
  try {
    console.log('🚀 Manual crawl triggered...');
    
    // 检查数据库连接状态
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      await updateEventProgress();
      res.json({ 
        success: true, 
        message: 'Manual crawl completed successfully', 
        database: 'connected',
        timestamp: new Date().toISOString() 
      });
    } else {
      // 演示模式 - 返回模拟的爬虫结果
      res.json({ 
        success: true, 
        message: 'Demo mode: Crawl simulation completed', 
        database: 'disconnected',
        demo_data: {
          events_found: 4,
          hot_events: [
            '黄杨耳环事件引发网络热议',
            '哈佛蒋事件持续发酵', 
            '协和董事件最新进展',
            '武大杨景媛事件校园关注'
          ],
          note: 'Please configure DATABASE_URL in .env for real functionality'
        },
        timestamp: new Date().toISOString() 
      });
    }
  } catch (error) {
    console.error('❌ Manual crawl failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Manual crawl failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 创建示例热点事件
app.post('/api/sample/create-hot-events', async (req, res) => {
  try {
    console.log('🔥 Creating sample hot events...');
    await createSampleHotEvents();
    res.json({ 
      success: true, 
      message: 'Sample hot events created successfully', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('❌ Failed to create sample events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create sample events',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 每天上午9点运行爬虫 (仅在本地环境)
if (process.env.NODE_ENV !== 'production') {
  cron.schedule('0 9 * * *', async () => {
    console.log('🕘 Starting scheduled crawl...');
    try {
      await updateEventProgress();
      console.log('✅ Scheduled crawl completed');
    } catch (error) {
      console.error('❌ Scheduled crawl failed:', error);
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
  console.log(`🌐 Available endpoints:`);
  console.log(`   GET  /api/health - 健康检查`);
  console.log(`   GET  /api/events - 获取事件列表`);
  console.log(`   POST /api/crawl/trigger - 手动触发爬虫`);
  console.log(`   POST /api/sample/create-hot-events - 创建示例热点事件`);
});