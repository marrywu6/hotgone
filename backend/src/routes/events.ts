import express from 'express';
import { EventModel, EventStatus, TimelineType } from '../models/Event';
import { EventTimelineService } from '../services/eventTimeline';

const router = express.Router();

// 获取所有事件
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category,
      startDate,
      endDate,
      date,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    
    // 构建查询条件
    const where: any = {};
    
    if (status) {
      where.status = status.toString().toUpperCase() as EventStatus;
    }
    
    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }
    
    // 日期过滤
    if (date) {
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.updatedAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (startDate || endDate) {
      where.updatedAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        where.updatedAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.updatedAt.lte = end;
      }
    }
    
    // 排序
    const orderBy: any = {};
    switch (sortBy) {
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'importance':
        orderBy.importance = sortOrder;
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      default:
        orderBy.updatedAt = sortOrder;
    }
    
    // 分页
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    // 执行查询
    const [events, total] = await Promise.all([
      EventModel.findMany({
        where,
        orderBy,
        skip,
        take
      }),
      EventModel.count(where)
    ]);
    
    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      filters: {
        status,
        category,
        startDate,
        endDate,
        date,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 获取热点事件榜单（按重要性和热度排序）
router.get('/hot/ranking', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const hotEvents = await EventModel.getHotEvents(Number(limit));
    
    res.json(hotEvents);
  } catch (error) {
    console.error('Error getting hot events:', error);
    res.status(500).json({ error: 'Failed to get hot events' });
  }
});

// 按日期获取事件 - 获取特定日期的所有事件
router.get('/by-date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { sortBy = 'importance', sortOrder = 'desc' } = req.query;
    
    // 解析日期
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const events = await EventModel.findByDateRange(startOfDay, endOfDay, {
      orderBy: { [sortBy as string]: sortOrder }
    });
    
    res.json({
      date,
      events,
      total: events.length,
      summary: `${date} 共找到 ${events.length} 个相关事件`
    });
    
  } catch (error) {
    console.error('Error getting events by date:', error);
    res.status(500).json({ error: 'Failed to get events by date' });
  }
});

// 获取日期范围内的事件
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Both startDate and endDate are required. Format: YYYY-MM-DD' 
      });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    if (start > end) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const events = await EventModel.findByDateRange(start, end, {
      take: Number(limit),
      orderBy: { [sortBy as string]: sortOrder }
    });
    
    // 按日期分组统计
    const eventsByDate = events.reduce((acc, event) => {
      const dateKey = new Date(event.updatedAt).toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 按分类统计
    const categories = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      events,
      statistics: {
        total: events.length,
        returned: events.length,
        byDate: eventsByDate,
        categories
      }
    });
    
  } catch (error) {
    console.error('Error getting events by date range:', error);
    res.status(500).json({ error: 'Failed to get events by date range' });
  }
});

// 获取事件日历 - 按月份统计事件数量
router.get('/calendar/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }
    
    // 构建该月的开始和结束日期
    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    
    const monthEvents = await EventModel.findByDateRange(startOfMonth, endOfMonth);
    
    // 按日期分组
    const eventsByDay = monthEvents.reduce((acc, event) => {
      const day = new Date(event.updatedAt).getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push({
        id: event.id,
        title: event.title,
        category: event.category,
        importance: event.importance
      });
      return acc;
    }, {} as Record<number, any[]>);
    
    // 生成日历数据
    const daysInMonth = endOfMonth.getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const events = eventsByDay[day] || [];
      calendar.push({
        day,
        date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        eventCount: events.length,
        events: events.slice(0, 3), // 只显示前3个事件
        hasMore: events.length > 3
      });
    }
    
    // 统计信息
    const categoriesThisMonth = monthEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveDay = Object.keys(eventsByDay).reduce((max, day) => 
      eventsByDay[parseInt(day)].length > (eventsByDay[parseInt(max)] || []).length ? day : max, '1'
    );
    
    res.json({
      year: yearNum,
      month: monthNum,
      monthName: new Date(yearNum, monthNum - 1).toLocaleString('zh-CN', { month: 'long' }),
      totalEvents: monthEvents.length,
      calendar,
      summary: {
        mostActiveDay,
        categoriesThisMonth
      }
    });
    
  } catch (error) {
    console.error('Error getting calendar data:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

// 搜索事件
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    const events = await EventModel.search(q as string, { skip, take });
    
    res.json(events);
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 获取单个事件详情
router.get('/:id', async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// 创建新事件
router.post('/', async (req, res) => {
  try {
    const event = await EventModel.create(req.body);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ error: 'Failed to create event' });
  }
});

// 更新事件
router.put('/:id', async (req, res) => {
  try {
    const event = await EventModel.update(req.params.id, req.body);
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ error: 'Failed to update event' });
  }
});

// 添加时间线事件
router.post('/:id/timeline', async (req, res) => {
  try {
    const timeline = await EventModel.addTimeline(req.params.id, req.body);
    res.status(201).json(timeline);
  } catch (error) {
    console.error('Error adding timeline:', error);
    res.status(400).json({ error: 'Failed to add timeline event' });
  }
});

// 获取事件详细脉络分析
router.get('/:id/context', async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const timelineService = EventTimelineService.getInstance();
    const context = await timelineService.analyzeAndBuildTimeline(event as any);
    
    res.json({
      event,
      context
    });
  } catch (error) {
    console.error('Error getting event context:', error);
    res.status(500).json({ error: 'Failed to get event context' });
  }
});

// 生成事件摘要报告
router.get('/:id/summary', async (req, res) => {
  try {
    const timelineService = EventTimelineService.getInstance();
    const summary = await timelineService.generateEventSummary(req.params.id);
    
    if (!summary) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ summary });
  } catch (error) {
    console.error('Error generating event summary:', error);
    res.status(500).json({ error: 'Failed to generate event summary' });
  }
});

// 获取相关事件
router.get('/:id/related', async (req, res) => {
  try {
    const timelineService = EventTimelineService.getInstance();
    const relatedEvents = await timelineService.findRelatedEvents(req.params.id);
    
    res.json(relatedEvents);
  } catch (error) {
    console.error('Error finding related events:', error);
    res.status(500).json({ error: 'Failed to find related events' });
  }
});

export default router;