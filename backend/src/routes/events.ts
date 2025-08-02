import express from 'express';
import { Event } from '../models/Event';

const router = express.Router();

// 获取所有事件
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    
    // 临时示例数据（开发阶段）
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
      }
    ];
    
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    let filteredEvents = sampleEvents;
    if (status) {
      filteredEvents = sampleEvents.filter(event => event.status === status);
    }
    if (category) {
      filteredEvents = filteredEvents.filter(event => event.category === category);
    }
    
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

export default router;