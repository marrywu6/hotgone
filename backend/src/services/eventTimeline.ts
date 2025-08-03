import { Event, IEvent, ITimeline } from '../models/Event';
import axios from 'axios';

interface EventContext {
  background: string;
  keyPersons: string[];
  timeline: TimelineItem[];
  impact: string[];
  currentStatus: string;
  publicReaction: string[];
}

interface TimelineItem {
  date: Date;
  title: string;
  content: string;
  source?: string;
  type: 'incident' | 'development' | 'response' | 'investigation' | 'resolution';
  importance: number;
}

interface HotEvent {
  keywords: string[];
  context: Partial<EventContext>;
  relatedTerms: string[];
}

// 热点事件模板库 - 包含你提到的具体事件
const HOT_EVENTS_TEMPLATES: Record<string, HotEvent> = {
  '黄杨耳环': {
    keywords: ['黄杨', '耳环', '地铁', '偷拍', '隐私'],
    context: {
      background: '地铁偷拍事件引发的社会对隐私保护和公共场所安全的关注',
      keyPersons: ['黄杨', '地铁工作人员', '相关执法部门'],
      impact: ['隐私保护意识提升', '公共场所监管加强', '法律法规完善讨论'],
      currentStatus: '案件处理中，相关部门加强监管措施'
    },
    relatedTerms: ['偷拍', '隐私权', '公共场所安全', '地铁安全', '法律维权']
  },
  
  '哈佛蒋': {
    keywords: ['哈佛', '蒋', '学术', '教育', '争议'],
    context: {
      background: '哈佛相关学术或教育争议事件',
      keyPersons: ['蒋某', '哈佛大学相关人员'],
      impact: ['国际教育交流讨论', '学术诚信关注', '教育公平话题'],
      currentStatus: '持续关注中'
    },
    relatedTerms: ['哈佛大学', '学术诚信', '教育公平', '国际教育', '学术争议']
  },
  
  '协和董': {
    keywords: ['协和', '董', '医学院', '教育', '医疗'],
    context: {
      background: '协和医学院相关事件引发的医学教育和医疗体系讨论',
      keyPersons: ['董某', '协和医学院相关人员', '医疗界人士'],
      impact: ['医学教育改革讨论', '医疗体系关注', '师生关系规范'],
      currentStatus: '相关部门调查处理中'
    },
    relatedTerms: ['协和医学院', '医学教育', '医疗改革', '师生关系', '医疗体系']
  },
  
  '武大杨景媛': {
    keywords: ['武大', '杨景媛', '师生关系', '大学', '教育'],
    context: {
      background: '武汉大学师生关系事件引发的高等教育管理和师德师风讨论',
      keyPersons: ['杨景媛', '武汉大学相关人员', '教育主管部门'],
      impact: ['师德师风建设', '高校管理制度完善', '学生权益保护'],
      currentStatus: '学校和相关部门已介入处理'
    },
    relatedTerms: ['武汉大学', '师生关系', '师德师风', '高等教育', '学生权益']
  },
  
  '董宇辉东方甄选': {
    keywords: ['董宇辉', '东方甄选', '俞敏洪', '直播', '带货'],
    context: {
      background: '东方甄选直播带货相关争议和商业模式讨论',
      keyPersons: ['董宇辉', '俞敏洪', '东方甄选团队'],
      impact: ['直播带货行业规范', '知识付费模式讨论', '教育转型话题'],
      currentStatus: '持续发展中，各方积极应对'
    },
    relatedTerms: ['直播带货', '知识付费', '教育转型', '商业模式', '网红经济']
  }
};

export class EventTimelineService {
  private static instance: EventTimelineService;

  private constructor() {}

  public static getInstance(): EventTimelineService {
    if (!EventTimelineService.instance) {
      EventTimelineService.instance = new EventTimelineService();
    }
    return EventTimelineService.instance;
  }

  // 分析事件并构建完整时间线
  async analyzeAndBuildTimeline(event: IEvent): Promise<EventContext> {
    const eventKey = this.identifyEventType(event);
    const template = HOT_EVENTS_TEMPLATES[eventKey];
    
    if (template) {
      return await this.buildContextFromTemplate(event, template);
    } else {
      return await this.buildContextFromContent(event);
    }
  }

  // 识别事件类型
  private identifyEventType(event: IEvent): string {
    const text = (event.title + ' ' + event.description + ' ' + event.keywords.join(' ')).toLowerCase();
    
    // 按匹配度排序，优先匹配更具体的事件
    const matches = Object.entries(HOT_EVENTS_TEMPLATES).map(([key, template]) => {
      const matchCount = template.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      ).length;
      return { key, matchCount, totalKeywords: template.keywords.length };
    });

    // 找到匹配度最高的事件类型
    matches.sort((a, b) => {
      const aScore = a.matchCount / a.totalKeywords;
      const bScore = b.matchCount / b.totalKeywords;
      return bScore - aScore;
    });

    if (matches[0] && matches[0].matchCount > 0) {
      return matches[0].key;
    }

    return 'general';
  }

  // 基于模板构建事件上下文
  private async buildContextFromTemplate(event: IEvent, template: HotEvent): Promise<EventContext> {
    const context: EventContext = {
      background: template.context.background || '社会关注事件',
      keyPersons: template.context.keyPersons || [],
      timeline: this.buildEnhancedTimeline(event),
      impact: template.context.impact || [],
      currentStatus: this.getCurrentStatus(event),
      publicReaction: await this.analyzePublicReaction(event, template.relatedTerms)
    };

    return context;
  }

  // 基于内容构建事件上下文
  private async buildContextFromContent(event: IEvent): Promise<EventContext> {
    const context: EventContext = {
      background: this.extractBackground(event),
      keyPersons: this.extractKeyPersons(event),
      timeline: this.buildEnhancedTimeline(event),
      impact: this.analyzeSocialImpact(event),
      currentStatus: this.getCurrentStatus(event),
      publicReaction: await this.analyzePublicReaction(event)
    };

    return context;
  }

  // 构建增强时间线
  private buildEnhancedTimeline(event: IEvent): TimelineItem[] {
    return event.timeline.map((item, index) => ({
      date: item.date,
      title: item.title,
      content: item.content,
      source: item.source,
      type: this.classifyTimelineType(item),
      importance: this.calculateTimelineImportance(item, index, event.timeline.length)
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // 分类时间线类型
  private classifyTimelineType(
    item: ITimeline
  ): 'incident' | 'development' | 'response' | 'investigation' | 'resolution' {
    const content = (item.title + ' ' + item.content).toLowerCase();
    
    if (content.includes('调查') || content.includes('立案') || content.includes('核实')) {
      return 'investigation';
    }
    if (content.includes('回应') || content.includes('声明') || content.includes('澄清')) {
      return 'response';
    }
    if (content.includes('解决') || content.includes('处理结果') || content.includes('结案')) {
      return 'resolution';
    }
    if (content.includes('进展') || content.includes('最新') || content.includes('更新')) {
      return 'development';
    }
    
    return item.type as any || 'development';
  }

  // 计算时间线重要性
  private calculateTimelineImportance(
    item: ITimeline, 
    index: number, 
    totalItems: number
  ): number {
    let importance = 5; // 基础重要性

    // 首个事件更重要
    if (index === 0) importance += 3;
    
    // 最新事件更重要
    if (index === totalItems - 1) importance += 2;

    // 基于内容类型调整重要性
    const content = (item.title + ' ' + item.content).toLowerCase();
    if (content.includes('官方') || content.includes('正式')) importance += 2;
    if (content.includes('调查结果') || content.includes('处理决定')) importance += 3;
    if (content.includes('道歉') || content.includes('澄清')) importance += 2;

    return Math.min(importance, 10);
  }

  // 提取事件背景
  private extractBackground(event: IEvent): string {
    // 基于关键词和类别生成背景描述
    const category = event.category;
    const keywords = event.keywords.slice(0, 5).join('、');
    
    return `${category}相关事件，涉及${keywords}等关键要素，引起社会广泛关注和讨论。`;
  }

  // 提取关键人物
  private extractKeyPersons(event: IEvent): string[] {
    const text = event.title + ' ' + event.description + ' ' + event.keywords.join(' ');
    const persons: string[] = [];

    // 基于姓名模式识别人物
    const namePatterns = [
      /([王李张刘陈杨黄赵周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段漕钱汤尹黎易常武乔贺赖龚文][一-龯]{1,3})/g,
      /(董宇辉|杨景媛|俞敏洪|黄杨)/g
    ];

    namePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        persons.push(...matches);
      }
    });

    // 去重并限制数量
    return [...new Set(persons)].slice(0, 5);
  }

  // 分析社会影响
  private analyzeSocialImpact(event: IEvent): string[] {
    const impacts: string[] = [];
    const text = (event.title + ' ' + event.description).toLowerCase();

    const impactCategories = {
      '法律法规': ['法律', '法规', '规定', '条例', '法案'],
      '教育改革': ['教育', '学校', '师生', '教学', '学术'],
      '医疗体系': ['医疗', '医院', '医生', '患者', '医学'],
      '社会安全': ['安全', '保护', '监管', '防范', '治理'],
      '公众意识': ['意识', '认知', '观念', '态度', '价值观'],
      '行业规范': ['规范', '标准', '制度', '管理', '监督']
    };

    Object.entries(impactCategories).forEach(([impact, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        impacts.push(impact);
      }
    });

    return impacts.length > 0 ? impacts : ['社会关注度提升'];
  }

  // 获取当前状态
  private getCurrentStatus(event: IEvent): string {
    if (event.status === 'resolved') {
      return '事件已得到妥善处理和解决';
    }
    
    if (event.timeline.length > 0) {
      const latestItem = event.timeline[event.timeline.length - 1];
      const content = latestItem.content.toLowerCase();
      
      if (content.includes('调查')) return '相关部门正在调查处理中';
      if (content.includes('处理')) return '事件处理进行中';
      if (content.includes('回应')) return '相关方已作出回应';
      if (content.includes('解决')) return '事件已基本解决';
    }

    return event.status === 'active' ? '事件持续关注中' : '事件处理中';
  }

  // 分析公众反应
  private async analyzePublicReaction(
    event: IEvent, 
    relatedTerms: string[] = []
  ): Promise<string[]> {
    const reactions: string[] = [];

    // 基于事件关键词和相关术语分析可能的公众反应
    const text = (event.title + ' ' + event.description + ' ' + event.keywords.join(' ')).toLowerCase();
    
    const reactionPatterns = {
      '强烈关注': ['热议', '关注', '讨论', '争议', '话题'],
      '支持声援': ['支持', '声援', '点赞', '认同', '赞同'],
      '质疑批评': ['质疑', '批评', '谴责', '不满', '抗议'],
      '理性讨论': ['分析', '思考', '建议', '呼吁', '倡议'],
      '情感共鸣': ['同情', '理解', '感动', '心疼', '担忧'],
      '法律关注': ['维权', '法律', '权益', '正义', '公平']
    };

    Object.entries(reactionPatterns).forEach(([reaction, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        reactions.push(reaction);
      }
    });

    // 基于事件重要性和类别添加默认反应
    if (event.importance > 7) {
      reactions.push('广泛关注');
    }
    
    if (event.category === '教育医疗') {
      reactions.push('专业讨论');
    }

    return reactions.length > 0 ? reactions : ['社会关注'];
  }

  // 更新事件脉络
  async updateEventContext(eventId: string, newContent: string, source?: string): Promise<void> {
    try {
      const event = await Event.findById(eventId);
      if (!event) return;

      // 添加新的时间线项
      const newTimelineItem: ITimeline = {
        date: new Date(),
        title: '事件进展更新',
        content: newContent,
        source: source,
        type: 'development'
      };

      event.timeline.push(newTimelineItem);
      event.updatedAt = new Date();
      
      await event.save();
      console.log(`Updated timeline for event: ${event.title}`);
    } catch (error) {
      console.error('Error updating event context:', error);
    }
  }

  // 生成事件摘要报告
  async generateEventSummary(eventId: string): Promise<string> {
    try {
      const event = await Event.findById(eventId);
      if (!event) return '';

      const context = await this.analyzeAndBuildTimeline(event);
      
      const summary = `
【事件概况】${event.title}

【背景介绍】${context.background}

【关键人物】${context.keyPersons.join('、')}

【事件进展】（${context.timeline.length}个关键节点）
${context.timeline.map((item, index) => 
  `${index + 1}. ${item.date.toLocaleDateString()} - ${item.title}`
).join('\n')}

【社会影响】${context.impact.join('、')}

【公众反应】${context.publicReaction.join('、')}

【当前状态】${context.currentStatus}

【更新时间】${event.updatedAt.toLocaleString()}
      `;

      return summary.trim();
    } catch (error) {
      console.error('Error generating event summary:', error);
      return '';
    }
  }

  // 查找相关事件
  async findRelatedEvents(eventId: string): Promise<IEvent[]> {
    try {
      const event = await Event.findById(eventId);
      if (!event) return [];

      // 基于关键词查找相关事件
      const relatedEvents = await Event.find({
        _id: { $ne: eventId },
        $or: [
          { keywords: { $in: event.keywords } },
          { category: event.category },
          { title: { $regex: event.keywords.slice(0, 3).join('|'), $options: 'i' } }
        ]
      }).limit(5).sort({ importance: -1, updatedAt: -1 });

      return relatedEvents;
    } catch (error) {
      console.error('Error finding related events:', error);
      return [];
    }
  }
}

export default EventTimelineService;