import express from 'express';
import { Event } from '../models/Event';
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
    
    // 构建日期过滤条件
    const dateFilter: any = {};
    
    if (date) {
      // 如果指定了具体日期，查找该日期的事件
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter.$gte = startOfDay;
      dateFilter.$lte = endOfDay;
    } else {
      // 如果指定了日期范围
      if (startDate) {
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }
    
    // 临时示例数据（开发阶段）- 添加更多带日期的事件
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注，涉及医学教育质量和公平性问题。",
        category: "教育医疗",
        status: "ongoing",
        timeline: [
          {
            _id: "t1",
            date: new Date('2024-01-15'),
            title: "事件曝光",
            content: "网络上开始讨论协和医学院的4+4教育模式存在的问题",
            type: "incident"
          }
        ],
        sources: ["https://example.com/xiehe-news"],
        keywords: ["协和", "医学教育", "4+4", "教育改革"],
        importance: 8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        description: "成都地铁内发生乘客偷拍他人的不当行为，引发公众对公共场所安全和隐私保护的关注。",
        category: "社会安全",
        status: "resolved",
        timeline: [],
        sources: ["https://example.com/chengdu-metro"],
        keywords: ["成都", "地铁", "偷拍", "隐私保护"],
        importance: 7,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        description: "武汉大学相关人员行为不当事件引发校园风气和师生关系的讨论。",
        category: "高等教育",
        status: "active",
        timeline: [],
        sources: ["https://example.com/whu-news"],
        keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
        importance: 6,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      },
      {
        _id: "4",
        title: "黄杨地铁耳环偷拍事件深度调查",
        description: "黄杨地铁偷拍事件后续调查结果公布，相关法律法规得到完善。",
        category: "社会安全",
        status: "resolved",
        timeline: [],
        sources: ["https://example.com/huangyang-news"],
        keywords: ["黄杨", "耳环", "地铁", "偷拍", "调查"],
        importance: 8,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: "5",
        title: "董宇辉东方甄选商业模式争议",
        description: "董宇辉在东方甄选的商业运作模式引发关于知识付费和教育商业化的讨论。",
        category: "商业经济",
        status: "ongoing",
        timeline: [],
        sources: ["https://example.com/dongfang-news"],
        keywords: ["董宇辉", "东方甄选", "俞敏洪", "知识付费"],
        importance: 7,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-03-01')
      },
      {
        _id: "6",
        title: "哈佛蒋某学术争议事件进展",
        description: "哈佛大学相关学术争议事件的最新调查进展，对国际学术交流产生影响。",
        category: "国际教育",
        status: "active",
        timeline: [],
        sources: ["https://example.com/harvard-news"],
        keywords: ["哈佛", "蒋某", "学术争议", "国际教育"],
        importance: 6,
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-03-10')
      }
    ];
    
    // 应用过滤条件
    let filteredEvents = sampleEvents;
    
    // 状态过滤
    if (status) {
      filteredEvents = filteredEvents.filter(event => event.status === status);
    }
    
    // 分类过滤
    if (category) {
      filteredEvents = filteredEvents.filter(event => event.category === category);
    }
    
    // 日期过滤
    if (Object.keys(dateFilter).length > 0) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.updatedAt);
        
        if (dateFilter.$gte && eventDate < dateFilter.$gte) return false;
        if (dateFilter.$lte && eventDate > dateFilter.$lte) return false;
        
        return true;
      });
    }
    
    // 排序
    const sortField = sortBy as string;
    const order = sortOrder === 'desc' ? -1 : 1;
    
    filteredEvents.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'importance':
          aValue = a.importance;
          bValue = b.importance;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          return order * (aValue > bValue ? 1 : -1);
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }
      
      return order * (bValue - aValue);
    });
    
    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const events = filteredEvents.slice(startIndex, endIndex);
    
    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredEvents.length,
        pages: Math.ceil(filteredEvents.length / Number(limit))
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
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// 搜索事件
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // 临时示例数据中的搜索
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注，涉及医学教育质量和公平性问题。详细内容包括对现有教育体制的质疑、学生权益保护、以及医学教育改革的必要性讨论。",
        category: "教育医疗",
        status: "ongoing",
        timeline: [],
        sources: ["https://example.com/xiehe-news", "https://example.com/medical-education"],
        keywords: ["协和", "医学教育", "4+4", "教育改革"],
        importance: 8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        description: "成都地铁内发生乘客偷拍他人的不当行为，引发公众对公共场所安全和隐私保护的关注。",
        category: "社会安全",
        status: "resolved",
        timeline: [],
        sources: ["https://example.com/chengdu-metro"],
        keywords: ["成都", "地铁", "偷拍", "隐私保护"],
        importance: 7,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        description: "武汉大学相关人员行为不当事件引发校园风气和师生关系的讨论。",
        category: "高等教育",
        status: "active",
        timeline: [],
        sources: ["https://example.com/whu-news"],
        keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
        importance: 6,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      }
    ];
    
    const query = String(q).toLowerCase();
    
    // 多维度搜索
    const results = sampleEvents.filter(event => {
      const titleMatch = event.title.toLowerCase().includes(query);
      const descriptionMatch = event.description.toLowerCase().includes(query);
      const keywordMatch = event.keywords.some(keyword => 
        keyword.toLowerCase().includes(query)
      );
      const categoryMatch = event.category.toLowerCase().includes(query);
      
      return titleMatch || descriptionMatch || keywordMatch || categoryMatch;
    });
    
    // 按相关性排序
    const scoredResults = results.map(event => {
      let score = 0;
      const query_lower = query.toLowerCase();
      
      // 标题匹配得分最高
      if (event.title.toLowerCase().includes(query_lower)) {
        score += 10;
      }
      
      // 关键词匹配
      event.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(query_lower)) {
          score += 5;
        }
      });
      
      // 描述匹配
      if (event.description.toLowerCase().includes(query_lower)) {
        score += 3;
      }
      
      // 分类匹配
      if (event.category.toLowerCase().includes(query_lower)) {
        score += 2;
      }
      
      return { ...event, relevanceScore: score };
    });
    
    // 按相关性和重要性排序
    scoredResults.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.importance - a.importance;
    });
    
    res.json(scoredResults.map(({ relevanceScore, ...event }) => event));
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// 获取单个事件详情
router.get('/:id', async (req, res) => {
  try {
    // 临时示例数据
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注，涉及医学教育质量和公平性问题。详细内容包括对现有教育体制的质疑、学生权益保护、以及医学教育改革的必要性讨论。",
        category: "教育医疗",
        status: "ongoing",
        timeline: [
          {
            _id: "t1",
            date: new Date('2024-01-15'),
            title: "事件曝光",
            content: "网络上开始讨论协和医学院的4+4教育模式存在的问题，有学生和家长反映该模式可能存在不公平性。",
            type: "incident"
          },
          {
            _id: "t2",
            date: new Date('2024-01-20'),
            title: "官方回应",
            content: "协和医学院发布官方声明，回应相关质疑，解释4+4教育模式的设计初衷和实施细节。",
            type: "development"
          },
          {
            _id: "t3",
            date: new Date('2024-01-25'),
            title: "专家讨论",
            content: "医学教育专家就此事件展开讨论，探讨医学教育改革的方向和学生权益保护问题。",
            type: "development"
          }
        ],
        sources: ["https://example.com/xiehe-news", "https://example.com/medical-education"],
        keywords: ["协和", "医学教育", "4+4", "教育改革"],
        importance: 8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        description: "成都地铁内发生乘客偷拍他人的不当行为，引发公众对公共场所安全和隐私保护的关注。",
        category: "社会安全",
        status: "resolved",
        timeline: [
          {
            _id: "t4",
            date: new Date('2024-02-10'),
            title: "事件发生",
            content: "有乘客举报地铁内有人偷拍，相关视频在网络传播，引发公众关注。",
            type: "incident"
          },
          {
            _id: "t5",
            date: new Date('2024-02-12'),
            title: "警方介入",
            content: "成都警方对此事展开调查，嫌疑人被抓获，案件进入司法程序。",
            type: "development"
          },
          {
            _id: "t6",
            date: new Date('2024-02-15'),
            title: "案件结案",
            content: "嫌疑人被依法处理，地铁方面加强安全监管，安装更多监控设备。",
            type: "resolution"
          }
        ],
        sources: ["https://example.com/chengdu-metro"],
        keywords: ["成都", "地铁", "偷拍", "隐私保护"],
        importance: 7,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        description: "武汉大学相关人员行为不当事件引发校园风气和师生关系的讨论。",
        category: "高等教育",
        status: "active",
        timeline: [
          {
            _id: "t7",
            date: new Date('2024-03-01'),
            title: "事件曝光",
            content: "网络上传播相关不当行为的举报材料，引发广泛关注。",
            type: "incident"
          },
          {
            _id: "t8",
            date: new Date('2024-03-05'),
            title: "学校调查",
            content: "武汉大学成立调查组对此事进行核实，承诺严肃处理。",
            type: "development"
          }
        ],
        sources: ["https://example.com/whu-news"],
        keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
        importance: 6,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      }
    ];
    
    const event = sampleEvents.find(e => e._id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// 创建新事件
router.post('/', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create event' });
  }
});

// 更新事件
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update event' });
  }
});

// 添加时间线事件
router.post('/:id/timeline', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.timeline.push(req.body);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add timeline event' });
  }
});

// 获取事件详细脉络分析
router.get('/:id/context', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const timelineService = EventTimelineService.getInstance();
    const context = await timelineService.analyzeAndBuildTimeline(event);
    
    res.json({
      event: {
        _id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        status: event.status,
        importance: event.importance,
        keywords: event.keywords,
        sources: event.sources,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      },
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

// 获取热点事件榜单（按重要性和热度排序）
router.get('/hot/ranking', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 获取最热门的事件，包含你提到的具体事件
    const hotEvents = await Event.find()
      .sort({ importance: -1, updatedAt: -1 })
      .limit(Number(limit))
      .select('title description category status importance keywords createdAt updatedAt');
    
    // 如果没有实际数据，返回示例热点事件
    if (hotEvents.length === 0) {
      const sampleHotEvents = [
        {
          _id: "hot1",
          title: "武汉大学杨景媛师生关系事件深度分析",
          description: "武汉大学师生关系不当行为事件持续发酵，引发教育界对师德师风建设的深度反思",
          category: "教育医疗",
          status: "ongoing",
          importance: 9,
          keywords: ["武汉大学", "杨景媛", "师生关系", "师德师风", "教育改革"],
          timeline_count: 8,
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date()
        },
        {
          _id: "hot2", 
          title: "协和医学院董某教育争议事件追踪",
          description: "协和医学院相关人员行为引发的医学教育模式和医疗体系讨论持续升温",
          category: "教育医疗",
          status: "active",
          importance: 8,
          keywords: ["协和医学院", "协和董", "医学教育", "医疗改革"],
          timeline_count: 6,
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date()
        },
        {
          _id: "hot3",
          title: "黄杨地铁耳环偷拍事件后续影响",
          description: "地铁偷拍事件引发的隐私保护和公共安全讨论，推动相关法规完善",
          category: "社会安全", 
          status: "resolved",
          importance: 7,
          keywords: ["黄杨", "耳环", "地铁", "偷拍", "隐私保护"],
          timeline_count: 5,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-02-10')
        },
        {
          _id: "hot4",
          title: "董宇辉东方甄选商业风波分析",
          description: "东方甄选直播带货模式争议及其对知识付费行业的影响",
          category: "商业经济",
          status: "ongoing", 
          importance: 6,
          keywords: ["董宇辉", "东方甄选", "俞敏洪", "直播带货", "知识付费"],
          timeline_count: 4,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date()
        },
        {
          _id: "hot5",
          title: "哈佛蒋某学术争议国际影响",
          description: "哈佛相关学术争议事件对中美教育交流和学术诚信的影响分析",
          category: "国际教育",
          status: "active",
          importance: 6,
          keywords: ["哈佛", "蒋某", "学术争议", "国际教育", "学术诚信"],
          timeline_count: 3,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date()
        }
      ];
      
      return res.json(sampleHotEvents);
    }
    
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
    
    // 示例数据中按日期过滤
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注",
        category: "教育医疗",
        status: "ongoing",
        importance: 8,
        keywords: ["协和", "医学教育", "4+4", "教育改革"],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: "4",
        title: "黄杨地铁耳环偷拍事件深度调查",
        description: "黄杨地铁偷拍事件后续调查结果公布",
        category: "社会安全",
        status: "resolved",
        importance: 8,
        keywords: ["黄杨", "耳环", "地铁", "偷拍", "调查"],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        description: "成都地铁内发生乘客偷拍他人的不当行为",
        category: "社会安全",
        status: "resolved",
        importance: 7,
        keywords: ["成都", "地铁", "偷拍", "隐私保护"],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "5",
        title: "董宇辉东方甄选商业模式争议",
        description: "董宇辉在东方甄选的商业运作模式引发关于知识付费和教育商业化的讨论",
        category: "商业经济",
        status: "ongoing",
        importance: 7,
        keywords: ["董宇辉", "东方甄选", "俞敏洪", "知识付费"],
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-03-01')
      },
      {
        _id: "6",
        title: "哈佛蒋某学术争议事件进展",
        description: "哈佛大学相关学术争议事件的最新调查进展",
        category: "国际教育",
        status: "active",
        importance: 6,
        keywords: ["哈佛", "蒋某", "学术争议", "国际教育"],
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-03-10')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        description: "武汉大学相关人员行为不当事件引发校园风气和师生关系的讨论",
        category: "高等教育",
        status: "active",
        importance: 6,
        keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      }
    ];
    
    // 按日期过滤（基于updatedAt字段）
    const eventsOnDate = sampleEvents.filter(event => {
      const eventDate = new Date(event.updatedAt);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
    
    // 排序
    const sortField = sortBy as string;
    const order = sortOrder === 'desc' ? -1 : 1;
    
    eventsOnDate.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'importance':
          return order * (b.importance - a.importance);
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          return order * (bValue - aValue);
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          return order * (bValue - aValue);
        case 'title':
          return order * (a.title > b.title ? 1 : -1);
        default:
          return order * (b.importance - a.importance);
      }
    });
    
    res.json({
      date,
      events: eventsOnDate,
      total: eventsOnDate.length,
      summary: `${date} 共找到 ${eventsOnDate.length} 个相关事件`
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
    
    // 示例数据
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注",
        category: "教育医疗",
        status: "ongoing",
        importance: 8,
        keywords: ["协和", "医学教育", "4+4", "教育改革"],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: "4",
        title: "黄杨地铁耳环偷拍事件深度调查",
        description: "黄杨地铁偷拍事件后续调查结果公布",
        category: "社会安全",
        status: "resolved",
        importance: 8,
        keywords: ["黄杨", "耳环", "地铁", "偷拍", "调查"],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        description: "成都地铁内发生乘客偷拍他人的不当行为",
        category: "社会安全",
        status: "resolved",
        importance: 7,
        keywords: ["成都", "地铁", "偷拍", "隐私保护"],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "5",
        title: "董宇辉东方甄选商业模式争议",
        description: "董宇辉在东方甄选的商业运作模式引发讨论",
        category: "商业经济",
        status: "ongoing",
        importance: 7,
        keywords: ["董宇辉", "东方甄选", "俞敏洪", "知识付费"],
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-03-01')
      },
      {
        _id: "6",
        title: "哈佛蒋某学术争议事件进展",
        description: "哈佛大学相关学术争议事件的最新调查进展",
        category: "国际教育",
        status: "active",
        importance: 6,
        keywords: ["哈佛", "蒋某", "学术争议", "国际教育"],
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-03-10')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        description: "武汉大学相关人员行为不当事件引发讨论",
        category: "高等教育",
        status: "active",
        importance: 6,
        keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      }
    ];
    
    // 按日期范围过滤
    const eventsInRange = sampleEvents.filter(event => {
      const eventDate = new Date(event.updatedAt);
      return eventDate >= start && eventDate <= end;
    });
    
    // 排序
    const sortField = sortBy as string;
    const order = sortOrder === 'desc' ? -1 : 1;
    
    eventsInRange.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'importance':
          return order * (b.importance - a.importance);
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          return order * (bValue - aValue);
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          return order * (bValue - aValue);
        default:
          return order * (b.importance - a.importance);
      }
    });
    
    // 限制数量
    const limitedEvents = eventsInRange.slice(0, Number(limit));
    
    // 按日期分组统计
    const eventsByDate = eventsInRange.reduce((acc, event) => {
      const dateKey = new Date(event.updatedAt).toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      dateRange: {
        startDate: startDate,
        endDate: endDate,
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      events: limitedEvents,
      statistics: {
        total: eventsInRange.length,
        returned: limitedEvents.length,
        byDate: eventsByDate,
        categories: eventsInRange.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
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
    
    // 示例数据
    const sampleEvents = [
      {
        _id: "1",
        title: "协和医院4+4医学教育改革争议",
        category: "教育医疗",
        importance: 8,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: "4",
        title: "黄杨地铁耳环偷拍事件深度调查",
        category: "社会安全",
        importance: 8,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: "2",
        title: "成都地铁偷拍事件",
        category: "社会安全",
        importance: 7,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: "5",
        title: "董宇辉东方甄选商业模式争议",
        category: "商业经济",
        importance: 7,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-03-01')
      },
      {
        _id: "6",
        title: "哈佛蒋某学术争议事件进展",
        category: "国际教育",
        importance: 6,
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-03-10')
      },
      {
        _id: "3",
        title: "武汉大学杨景媛事件",
        category: "高等教育",
        importance: 6,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-05')
      }
    ];
    
    // 过滤该月的事件
    const monthEvents = sampleEvents.filter(event => {
      const eventDate = new Date(event.updatedAt);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
    
    // 按日期分组
    const eventsByDay = monthEvents.reduce((acc, event) => {
      const day = new Date(event.updatedAt).getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({
        _id: event._id,
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
    
    res.json({
      year: yearNum,
      month: monthNum,
      monthName: new Date(yearNum, monthNum - 1).toLocaleString('zh-CN', { month: 'long' }),
      totalEvents: monthEvents.length,
      calendar,
      summary: {
        mostActiveDay: Object.keys(eventsByDay).reduce((max, day) => 
          eventsByDay[parseInt(day)].length > (eventsByDay[parseInt(max)] || []).length ? day : max, '1'
        ),
        categoriesThisMonth: monthEvents.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
    
  } catch (error) {
    console.error('Error getting calendar data:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
});

export default router;