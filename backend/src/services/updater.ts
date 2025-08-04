import { EventModel, EventStatus } from '../models/Event';
import { crawlEvents } from './crawler';
import prisma from '../lib/database';

export async function updateEventProgress(): Promise<void> {
  console.log('🚀 Starting enhanced event progress update...');
  
  try {
    // 运行爬虫收集热点事件
    console.log('📡 Running crawler to collect hot events...');
    await crawlEvents();
    
    // 获取所有活跃事件进行更新
    const activeEvents = await EventModel.findMany({
      where: {
        status: {
          in: [EventStatus.ACTIVE, EventStatus.ONGOING]
        }
      }
    });
    
    console.log(`✅ Found ${activeEvents.length} active events to update`);
    
    // 检查长时间无更新的事件，标记为已解决
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const staleEvents = await EventModel.findMany({
      where: {
        status: {
          in: [EventStatus.ACTIVE, EventStatus.ONGOING]
        },
        updatedAt: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    console.log(`🔄 Found ${staleEvents.length} stale events to resolve`);
    
    for (const event of staleEvents) {
      await markEventAsResolved(event.id);
    }
    
    // 分析和更新事件趋势
    await analyzeEventTrends();
    
    console.log('✅ Enhanced event progress update completed');
    
  } catch (error) {
    console.error('❌ Failed to update event progress:', error);
    throw error; // 重新抛出错误以便API端点能正确响应
  }
}

async function markEventAsResolved(eventId: string): Promise<void> {
  try {
    // 添加解决时间线项
    await EventModel.addTimeline(eventId, {
      date: new Date(),
      title: '系统自动标记为已解决',
      content: '该事件30天内无新进展，系统自动标记为已解决状态',
      type: 'RESOLUTION'
    });
    
    // 更新事件状态
    await EventModel.update(eventId, {
      status: EventStatus.RESOLVED
    });
    
    console.log(`📝 Marked event as resolved: ${eventId}`);
  } catch (error) {
    console.error('❌ Failed to mark event as resolved:', error);
  }
}

export async function analyzeEventTrends(): Promise<void> {
  try {
    console.log('📊 Analyzing event trends...');
    
    // 分析最近7天的事件趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEvents = await EventModel.findMany({
      where: {
        updatedAt: {
          gte: sevenDaysAgo
        }
      },
      include: {
        timeline: true
      }
    });
    
    console.log(`📈 Analyzing ${recentEvents.length} recent events`);
    
    // 分析关键词趋势
    const keywordTrends = analyzeKeywordTrends(recentEvents);
    console.log('🔍 Top trending keywords:', Array.from(keywordTrends.entries()).slice(0, 5));
    
    // 分析类别趋势
    const categoryTrends = analyzeCategoryTrends(recentEvents);
    console.log('📂 Category trends:', Array.from(categoryTrends.entries()));
    
    // 更新事件重要性（基于趋势）
    let updatedCount = 0;
    for (const event of recentEvents) {
      const newImportance = calculateTrendBasedImportance(event, keywordTrends);
      if (newImportance !== event.importance) {
        await EventModel.update(event.id, {
          importance: newImportance
        });
        updatedCount++;
      }
    }
    
    console.log(`📊 Updated importance for ${updatedCount} events based on trends`);
    console.log('✅ Event trend analysis completed');
    
  } catch (error) {
    console.error('❌ Failed to analyze event trends:', error);
  }
}

function analyzeKeywordTrends(events: any[]): Map<string, number> {
  const keywordCount = new Map<string, number>();
  
  events.forEach(event => {
    event.keywords.forEach((keyword: string) => {
      keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
    });
  });
  
  return new Map([...keywordCount.entries()].sort((a, b) => b[1] - a[1]));
}

function analyzeCategoryTrends(events: any[]): Map<string, number> {
  const categoryCount = new Map<string, number>();
  
  events.forEach(event => {
    categoryCount.set(event.category, (categoryCount.get(event.category) || 0) + 1);
  });
  
  return categoryCount;
}

function calculateTrendBasedImportance(event: any, keywordTrends: Map<string, number>): number {
  let importance = event.importance;
  
  // 基于关键词热度调整重要性
  event.keywords.forEach((keyword: string) => {
    const trendCount = keywordTrends.get(keyword) || 0;
    if (trendCount > 10) importance += 2;
    else if (trendCount > 5) importance += 1;
  });
  
  // 基于时间线活跃度调整
  if (event.timeline) {
    const recentTimelineItems = event.timeline.filter((item: any) => {
      const itemDate = new Date(item.date);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      return itemDate > threeDaysAgo;
    });
    
    if (recentTimelineItems.length > 3) importance += 1;
    else if (recentTimelineItems.length === 0) importance -= 1;
  }
  
  return Math.max(1, Math.min(importance, 10));
}

// 创建示例热点事件的函数
export async function createSampleHotEvents(): Promise<void> {
  console.log('🔥 Creating sample hot events...');
  
  const sampleEvents = [
    {
      title: '黄杨耳环事件引发网络热议',
      description: '黄杨耳环相关事件在社交媒体上引起广泛关注和讨论',
      category: '社会热点',
      importance: 8,
      keywords: ['黄杨', '耳环', '网络热议', '社交媒体'],
      sources: ['微博', '抖音', '小红书']
    },
    {
      title: '哈佛蒋事件持续发酵',
      description: '哈佛蒋相关话题在教育圈引起关注',
      category: '教育社会',
      importance: 7,
      keywords: ['哈佛蒋', '教育', '留学', '争议'],
      sources: ['知乎', '微博', '新闻媒体']
    },
    {
      title: '协和董事件最新进展',
      description: '协和董相关事件的最新发展情况',
      category: '医疗教育',
      importance: 6,
      keywords: ['协和董', '医学教育', '协和医学院'],
      sources: ['官方声明', '新闻报道']
    },
    {
      title: '武大杨景媛事件校园关注',
      description: '武汉大学杨景媛事件在校园内外引起关注',
      category: '校园事件',
      importance: 6,
      keywords: ['武大', '杨景媛', '校园', '武汉大学'],
      sources: ['校园论坛', '社交媒体']
    }
  ];
  
  try {
    for (const eventData of sampleEvents) {
      // 检查是否已存在类似事件
      const existingEvents = await EventModel.search(eventData.title.substring(0, 10));
      
      if (existingEvents.length === 0) {
        await EventModel.create({
          ...eventData,
          status: EventStatus.ACTIVE,
          timeline: [{
            date: new Date(),
            title: '事件首次报道',
            content: eventData.description,
            type: 'INCIDENT'
          }]
        });
        console.log(`✅ Created sample event: ${eventData.title}`);
      } else {
        console.log(`⚠️ Event already exists: ${eventData.title}`);
      }
    }
    
    console.log('🎉 Sample hot events creation completed');
  } catch (error) {
    console.error('❌ Failed to create sample events:', error);
  }
}