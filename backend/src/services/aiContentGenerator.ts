import { SentimentAnalysisService } from './sentimentAnalysis';
import { EventCorrelationService } from './eventCorrelation';

// AI内容生成服务
export class AIContentGeneratorService {
  private static instance: AIContentGeneratorService;
  private sentimentService: SentimentAnalysisService;
  private correlationService: EventCorrelationService;

  // 内容模板库
  private readonly templates = {
    summary: {
      breaking: "【突发事件】{title}引发广泛关注。据了解，{description}。目前事态{status}，相关部门{action}。",
      update: "【事件进展】{title}有新进展。{update}。据{source}报道，{details}。",
      analysis: "【深度分析】关于{title}，从{timespan}的发展轨迹来看，{trend}。专家认为{opinion}。"
    },
    report: {
      daily: "今日共监测到{count}起重要社会事件，其中{categories}占主导。{trending}成为热点话题。",
      weekly: "本周社会关注度较高的事件包括{events}。整体而言，{sentiment}情绪占主导，{prediction}。"
    },
    notification: {
      alert: "【重要提醒】您关注的{category}领域出现重要动态：{title}。{summary}",
      digest: "【每日摘要】为您整理了{count}条相关资讯，重点关注：{highlights}"
    }
  };

  // AI写作风格配置
  private readonly styles = {
    formal: {
      tone: '正式客观',
      vocabulary: '规范用词',
      structure: '逻辑清晰'
    },
    casual: {
      tone: '轻松易懂',
      vocabulary: '通俗表达',
      structure: '简洁明了'
    },
    analytical: {
      tone: '深度分析',
      vocabulary: '专业术语',
      structure: '层次分明'
    }
  };

  private constructor() {
    this.sentimentService = SentimentAnalysisService.getInstance();
    this.correlationService = EventCorrelationService.getInstance();
  }

  public static getInstance(): AIContentGeneratorService {
    if (!AIContentGeneratorService.instance) {
      AIContentGeneratorService.instance = new AIContentGeneratorService();
    }
    return AIContentGeneratorService.instance;
  }

  // 生成事件摘要
  async generateEventSummary(event: any, style: 'formal' | 'casual' | 'analytical' = 'formal'): Promise<GeneratedContent> {
    const sentiment = this.sentimentService.analyzeSentiment(event.title + ' ' + event.description);
    const keywords = this.extractKeyPhrases(event);
    
    const context = {
      title: event.title,
      description: event.description,
      category: event.category,
      importance: event.importance,
      sentiment: sentiment.label,
      keywords: keywords.join('、'),
      timelineLength: event.timeline?.length || 0
    };

    let summary = '';
    
    switch (style) {
      case 'formal':
        summary = this.generateFormalSummary(context);
        break;
      case 'casual':
        summary = this.generateCasualSummary(context);
        break;
      case 'analytical':
        summary = this.generateAnalyticalSummary(context, event);
        break;
    }

    return {
      type: 'summary',
      content: summary,
      style,
      confidence: this.calculateContentConfidence(context),
      metadata: {
        wordCount: summary.length,
        keywords: keywords,
        sentiment: sentiment.label,
        generatedAt: new Date()
      }
    };
  }

  // 生成正式摘要
  private generateFormalSummary(context: any): string {
    const templates = [
      `关于${context.title}，经分析显示这是一起${context.category}类事件。${context.description}。事件重要程度为${context.importance}级，涉及${context.keywords}等关键要素。`,
      `${context.title}作为${context.category}领域的重要事件，其发展情况值得关注。根据现有信息，${context.description}。相关进展已有${context.timelineLength}次更新。`,
      `据报道，${context.title}引发社会广泛关注。该事件属于${context.category}范畴，${context.description}。从重要性评级${context.importance}分来看，此事具有重要意义。`
    ];
    
    return this.selectRandomTemplate(templates, context);
  }

  // 生成轻松摘要
  private generateCasualSummary(context: any): string {
    const templates = [
      `最近${context.title}这事儿挺受关注的。简单说就是${context.description}。大家都在讨论${context.keywords}，看起来还挺重要的。`,
      `说到${context.title}，这个${context.category}方面的事情确实值得聊聊。${context.description}。网上关于${context.keywords}的讨论很多。`,
      `${context.title}最近挺火的，属于${context.category}类的事。具体情况是${context.description}。重要度打分${context.importance}分，算是比较重要的事了。`
    ];
    
    return this.selectRandomTemplate(templates, context);
  }

  // 生成分析性摘要
  private generateAnalyticalSummary(context: any, event: any): string {
    const trendAnalysis = this.analyzeTrend(event);
    const impactAssessment = this.assessImpact(context);
    
    return `深度解析${context.title}：从${context.category}领域的角度来看，此事件具有${context.importance}级重要性。${context.description}。通过对${context.timelineLength}个时间节点的分析，可以观察到${trendAnalysis}。该事件的社会影响主要体现在${impactAssessment}。关键要素包括${context.keywords}，预计后续发展将${this.predictOutcome(context)}。`;
  }

  // 生成新闻报道
  async generateNewsReport(events: any[], timeframe: 'daily' | 'weekly' | 'monthly'): Promise<GeneratedContent> {
    const sortedEvents = events.sort((a, b) => b.importance - a.importance);
    const topEvents = sortedEvents.slice(0, 5);
    
    const categoryStats = this.calculateCategoryStats(events);
    const sentimentOverview = this.calculateSentimentOverview(events);
    const trendingTopics = this.identifyTrendingTopics(events);

    let report = '';
    
    switch (timeframe) {
      case 'daily':
        report = this.generateDailyReport(topEvents, categoryStats, trendingTopics);
        break;
      case 'weekly':
        report = this.generateWeeklyReport(topEvents, categoryStats, sentimentOverview);
        break;
      case 'monthly':
        report = this.generateMonthlyReport(topEvents, categoryStats, sentimentOverview);
        break;
    }

    return {
      type: 'report',
      content: report,
      style: 'formal',
      confidence: 0.85,
      metadata: {
        eventCount: events.length,
        timeframe,
        topCategories: Object.keys(categoryStats).slice(0, 3),
        generatedAt: new Date()
      }
    };
  }

  // 生成个性化推送内容
  async generatePersonalizedNotification(user: any, events: any[]): Promise<GeneratedContent> {
    const userPreferences = user.preferences || {};
    const relevantEvents = events.filter(event => 
      userPreferences.categories?.includes(event.category) ||
      event.importance >= (userPreferences.importance || 5)
    );

    const highlights = relevantEvents.slice(0, 3).map(event => ({
      title: event.title,
      summary: this.generateBriefSummary(event),
      importance: event.importance
    }));

    const notification = this.composePersonalizedMessage(user, highlights);

    return {
      type: 'notification',
      content: notification,
      style: 'casual',
      confidence: 0.9,
      metadata: {
        userId: user._id,
        eventCount: relevantEvents.length,
        highlightCount: highlights.length,
        generatedAt: new Date()
      }
    };
  }

  // 生成事件预测内容
  async generateEventPrediction(event: any, relatedEvents: any[]): Promise<GeneratedContent> {
    const correlation = await this.correlationService.findRelatedEvents(event, relatedEvents, 5);
    const prediction = await this.correlationService.predictEventDevelopment(event, relatedEvents);

    const predictionText = `
基于对${event.title}的深度分析，结合${correlation.length}个相关事件的历史数据，预测该事件的发展趋势如下：

**发展可能性：** ${(prediction.likelihood * 100).toFixed(1)}%的概率将在${prediction.timeframe}内得到进展。

**预期结果：** ${prediction.expectedOutcomes.join('、')}。

**影响因素：** ${prediction.influencingFactors.join('、')}。

**专业建议：** ${prediction.recommendations.join('；')}。

**置信度：** 基于历史数据分析，此预测的置信度为${(prediction.confidence * 100).toFixed(1)}%。
    `.trim();

    return {
      type: 'prediction',
      content: predictionText,
      style: 'analytical',
      confidence: prediction.confidence,
      metadata: {
        eventId: event._id,
        relatedEventCount: correlation.length,
        predictionTimeframe: prediction.timeframe,
        generatedAt: new Date()
      }
    };
  }

  // 生成智能问答
  async generateQAResponse(question: string, events: any[]): Promise<GeneratedContent> {
    const relevantEvents = this.findRelevantEventsForQuestion(question, events);
    const answer = this.constructAnswer(question, relevantEvents);

    return {
      type: 'qa',
      content: answer,
      style: 'casual',
      confidence: 0.75,
      metadata: {
        question,
        relevantEventCount: relevantEvents.length,
        generatedAt: new Date()
      }
    };
  }

  // 辅助方法
  private extractKeyPhrases(event: any): string[] {
    const text = event.title + ' ' + event.description;
    const phrases: string[] = [];
    
    // 提取机构名称
    const orgs = ['大学', '医院', '公司', '部门', '政府', '法院', '银行'];
    orgs.forEach(org => {
      const regex = new RegExp(`([\\u4e00-\\u9fa5]{2,8}${org})`, 'g');
      const matches = text.match(regex);
      if (matches) phrases.push(...matches);
    });
    
    // 提取关键词
    if (event.keywords) {
      phrases.push(...event.keywords);
    }
    
    return [...new Set(phrases)].slice(0, 5);
  }

  private calculateContentConfidence(context: any): number {
    let confidence = 0.7; // 基础置信度
    
    if (context.description.length > 50) confidence += 0.1;
    if (context.keywords.length > 0) confidence += 0.1;
    if (context.timelineLength > 2) confidence += 0.1;
    
    return Math.min(0.95, confidence);
  }

  private selectRandomTemplate(templates: string[], context: any): string {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return this.fillTemplate(template, context);
  }

  private fillTemplate(template: string, context: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => context[key] || match);
  }

  private analyzeTrend(event: any): string {
    const timeline = event.timeline || [];
    if (timeline.length < 2) return '发展趋势有待观察';
    
    const recentUpdates = timeline.slice(-3);
    const hasResolution = timeline.some((t: any) => t.type === 'resolution');
    
    if (hasResolution) return '事件已趋于稳定';
    if (recentUpdates.length >= 2) return '事件发展活跃';
    return '事件发展相对平缓';
  }

  private assessImpact(context: any): string {
    const impacts = [];
    
    if (context.importance >= 8) impacts.push('重大社会影响');
    if (context.category === '教育医疗') impacts.push('民生领域关注');
    if (context.sentiment === 'negative') impacts.push('公众情绪反应');
    
    return impacts.length > 0 ? impacts.join('、') : '社会关注度较高';
  }

  private predictOutcome(context: any): string {
    if (context.importance >= 8) return '引起相关部门高度重视';
    if (context.category === '法律案件') return '进入司法程序';
    return '持续受到关注';
  }

  private calculateCategoryStats(events: any[]): Record<string, number> {
    return events.reduce((stats, event) => {
      stats[event.category] = (stats[event.category] || 0) + 1;
      return stats;
    }, {});
  }

  private calculateSentimentOverview(events: any[]): any {
    const sentiments = events.map(event => 
      this.sentimentService.analyzeSentiment(event.title + ' ' + event.description)
    );
    
    const positive = sentiments.filter(s => s.label === 'positive').length;
    const negative = sentiments.filter(s => s.label === 'negative').length;
    const neutral = sentiments.filter(s => s.label === 'neutral').length;
    
    return { positive, negative, neutral, total: sentiments.length };
  }

  private identifyTrendingTopics(events: any[]): string[] {
    const keywordCount = new Map<string, number>();
    
    events.forEach(event => {
      (event.keywords || []).forEach((keyword: string) => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
      });
    });
    
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  private generateDailyReport(events: any[], categoryStats: any, trending: string[]): string {
    const topCategory = Object.keys(categoryStats)[0];
    const eventCount = events.length;
    
    return `今日热点事件概览：共监测到${eventCount}起重要社会事件，${topCategory}类事件关注度最高。热门话题包括${trending.slice(0,3).join('、')}等。其中，${events[0]?.title}因其重要程度达到${events[0]?.importance}级而备受关注。建议重点关注相关进展。`;
  }

  private generateWeeklyReport(events: any[], categoryStats: any, sentiment: any): string {
    const topCategories = Object.keys(categoryStats).slice(0, 3);
    const dominantSentiment = sentiment.negative > sentiment.positive ? '负面' : 
                             sentiment.positive > sentiment.negative ? '正面' : '中性';
    
    return `本周社会事件回顾：${topCategories.join('、')}等领域事件较为活跃。整体来看，${dominantSentiment}情绪占主导地位。重要事件包括${events.slice(0,3).map((e: any) => e.title).join('、')}等。下周需要继续关注这些事件的后续发展。`;
  }

  private generateMonthlyReport(events: any[], categoryStats: any, sentiment: any): string {
    const totalEvents = events.length;
    const avgImportance = events.reduce((sum, e) => sum + e.importance, 0) / events.length;
    
    return `月度社会事件分析报告：本月共记录${totalEvents}起重要社会事件，平均重要度${avgImportance.toFixed(1)}级。事件分布呈现出多元化特征，涵盖了${Object.keys(categoryStats).length}个主要领域。情感分析显示，公众关注呈现多样化态势。重点关注事件的长期影响和发展趋势。`;
  }

  private generateBriefSummary(event: any): string {
    return `${event.category}类事件，重要度${event.importance}级。${event.description.slice(0, 50)}...`;
  }

  private composePersonalizedMessage(user: any, highlights: any[]): string {
    const userName = user.username || '用户';
    const count = highlights.length;
    
    if (count === 0) {
      return `${userName}，今日暂无符合您关注偏好的重要事件更新。`;
    }
    
    const topEvent = highlights[0];
    return `${userName}，为您推送${count}条重要更新。重点关注：${topEvent.title}。${topEvent.summary}。详细信息请查看完整报告。`;
  }

  private findRelevantEventsForQuestion(question: string, events: any[]): any[] {
    const keywords = this.extractQuestionKeywords(question);
    return events.filter(event => {
      const eventText = (event.title + ' ' + event.description).toLowerCase();
      return keywords.some(keyword => eventText.includes(keyword.toLowerCase()));
    }).slice(0, 3);
  }

  private extractQuestionKeywords(question: string): string[] {
    // 简化的关键词提取
    const stopWords = ['什么', '怎么', '为什么', '哪里', '什么时候', '谁', '如何'];
    return question.split(/\s+/).filter(word => 
      word.length > 1 && !stopWords.includes(word)
    );
  }

  private constructAnswer(question: string, events: any[]): string {
    if (events.length === 0) {
      return '很抱歉，暂时没有找到与您问题相关的事件信息。您可以尝试其他关键词进行搜索。';
    }
    
    const event = events[0];
    return `根据现有信息，关于您的问题，可以参考${event.title}这一事件。${event.description}。如需了解更多详情，建议查看完整的事件时间线。`;
  }
}

// 类型定义
export interface GeneratedContent {
  type: 'summary' | 'report' | 'notification' | 'prediction' | 'qa';
  content: string;
  style: 'formal' | 'casual' | 'analytical';
  confidence: number;
  metadata: {
    [key: string]: any;
    generatedAt: Date;
  };
}