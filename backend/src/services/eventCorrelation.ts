// 事件关联性分析服务
export class EventCorrelationService {
  private static instance: EventCorrelationService;

  // 关联度权重配置
  private readonly correlationWeights = {
    keywordSimilarity: 0.3,    // 关键词相似度
    categorySimilarity: 0.2,   // 分类相似度
    timeSimilarity: 0.15,      // 时间相似度
    entitySimilarity: 0.25,    // 实体相似度
    sentimentSimilarity: 0.1   // 情感相似度
  };

  // 实体词典
  private readonly entityDict = {
    organizations: [
      '协和医学院', '协和医院', '武汉大学', '清华大学', '北京大学', '复旦大学',
      '教育部', '卫健委', '公安部', '最高法', '发改委', '央行', '证监会',
      '腾讯', '阿里巴巴', '百度', '华为', '字节跳动', '美团', '滴滴'
    ],
    locations: [
      '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
      '天津', '重庆', '南京', '苏州', '厦门', '青岛', '大连', '宁波'
    ],
    people: [
      '杨景媛', '张三', '李四', '王五' // 示例人名，实际使用中需要NER
    ],
    topics: [
      '教育改革', '医疗改革', '反腐败', '环保', '食品安全', '网络安全',
      '金融监管', '房地产', '就业', '养老', '医保', '税收'
    ]
  };

  private constructor() {}

  public static getInstance(): EventCorrelationService {
    if (!EventCorrelationService.instance) {
      EventCorrelationService.instance = new EventCorrelationService();
    }
    return EventCorrelationService.instance;
  }

  // 分析单个事件的关联事件
  async findRelatedEvents(targetEvent: any, allEvents: any[], limit: number = 10): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    for (const event of allEvents) {
      if (event._id === targetEvent._id) continue; // 跳过自己

      const correlation = this.calculateCorrelation(targetEvent, event);
      
      if (correlation.score > 0.3) { // 相关度阈值
        correlations.push({
          ...correlation,
          relatedEvent: event
        });
      }
    }

    // 按相关度排序
    correlations.sort((a, b) => b.score - a.score);
    
    return correlations.slice(0, limit);
  }

  // 计算两个事件的关联度
  calculateCorrelation(event1: any, event2: any): Correlation {
    const scores = {
      keyword: this.calculateKeywordSimilarity(event1, event2),
      category: this.calculateCategorySimilarity(event1, event2),
      time: this.calculateTimeSimilarity(event1, event2),
      entity: this.calculateEntitySimilarity(event1, event2),
      sentiment: this.calculateSentimentSimilarity(event1, event2)
    };

    // 加权总分
    const totalScore = 
      scores.keyword * this.correlationWeights.keywordSimilarity +
      scores.category * this.correlationWeights.categorySimilarity +
      scores.time * this.correlationWeights.timeSimilarity +
      scores.entity * this.correlationWeights.entitySimilarity +
      scores.sentiment * this.correlationWeights.sentimentSimilarity;

    return {
      score: Math.round(totalScore * 100) / 100,
      breakdown: scores,
      type: this.determineCorrelationType(scores),
      explanation: this.generateCorrelationExplanation(scores, event1, event2)
    };
  }

  // 关键词相似度
  private calculateKeywordSimilarity(event1: any, event2: any): number {
    const keywords1 = new Set(event1.keywords || []);
    const keywords2 = new Set(event2.keywords || []);
    
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // 分类相似度
  private calculateCategorySimilarity(event1: any, event2: any): number {
    if (!event1.category || !event2.category) return 0;
    
    // 完全匹配
    if (event1.category === event2.category) return 1.0;
    
    // 相关分类匹配
    const relatedCategories = {
      '教育医疗': ['教育政策', '医疗卫生', '高等教育'],
      '社会安全': ['法律案件', '企业管理'],
      '政府政策': ['经济金融', '环境健康']
    };
    
    for (const [mainCat, subCats] of Object.entries(relatedCategories)) {
      if ((event1.category === mainCat && subCats.includes(event2.category)) ||
          (event2.category === mainCat && subCats.includes(event1.category))) {
        return 0.6;
      }
    }
    
    return 0;
  }

  // 时间相似度
  private calculateTimeSimilarity(event1: any, event2: any): number {
    const date1 = new Date(event1.createdAt);
    const date2 = new Date(event2.createdAt);
    
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    // 时间越近，相似度越高
    if (daysDiff <= 1) return 1.0;
    if (daysDiff <= 7) return 0.8;
    if (daysDiff <= 30) return 0.6;
    if (daysDiff <= 90) return 0.4;
    if (daysDiff <= 365) return 0.2;
    
    return 0;
  }

  // 实体相似度
  private calculateEntitySimilarity(event1: any, event2: any): number {
    const entities1 = this.extractEntities(event1.title + ' ' + event1.description);
    const entities2 = this.extractEntities(event2.title + ' ' + event2.description);
    
    if (entities1.length === 0 && entities2.length === 0) return 0;
    
    const intersection = entities1.filter(e => entities2.includes(e));
    const union = [...new Set([...entities1, ...entities2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  // 情感相似度
  private calculateSentimentSimilarity(event1: any, event2: any): number {
    // 这里需要导入情感分析服务
    // 简化版本：基于关键词推断情感
    const sentiment1 = this.inferSentiment(event1.title + ' ' + event1.description);
    const sentiment2 = this.inferSentiment(event2.title + ' ' + event2.description);
    
    const diff = Math.abs(sentiment1 - sentiment2);
    return 1 - diff; // 情感差异越小，相似度越高
  }

  // 提取实体
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    Object.values(this.entityDict).flat().forEach(entity => {
      if (text.includes(entity)) {
        entities.push(entity);
      }
    });
    
    return entities;
  }

  // 简化的情感推断
  private inferSentiment(text: string): number {
    const positiveWords = ['好', '优秀', '成功', '改善', '支持', '肯定'];
    const negativeWords = ['坏', '问题', '失败', '批评', '质疑', '争议'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (text.includes(word)) score += 0.2;
    });
    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  // 确定关联类型
  private determineCorrelationType(scores: any): CorrelationType {
    const { keyword, category, time, entity } = scores;
    
    if (entity > 0.5) return 'entity_based';
    if (category === 1.0 && time > 0.6) return 'categorical_temporal';
    if (keyword > 0.4) return 'thematic';
    if (time > 0.8) return 'temporal';
    if (category > 0.5) return 'categorical';
    
    return 'weak';
  }

  // 生成关联解释
  private generateCorrelationExplanation(scores: any, event1: any, event2: any): string {
    const explanations: string[] = [];
    
    if (scores.entity > 0.3) {
      const commonEntities = this.findCommonEntities(event1, event2);
      explanations.push(`涉及相同实体：${commonEntities.join('、')}`);
    }
    
    if (scores.keyword > 0.3) {
      const commonKeywords = this.findCommonKeywords(event1, event2);
      explanations.push(`共同关键词：${commonKeywords.join('、')}`);
    }
    
    if (scores.category === 1.0) {
      explanations.push(`属于同一分类：${event1.category}`);
    } else if (scores.category > 0.5) {
      explanations.push(`分类相关：${event1.category} - ${event2.category}`);
    }
    
    if (scores.time > 0.6) {
      explanations.push('发生时间接近');
    }
    
    return explanations.length > 0 ? explanations.join('；') : '弱关联';
  }

  // 查找共同实体
  private findCommonEntities(event1: any, event2: any): string[] {
    const entities1 = this.extractEntities(event1.title + ' ' + event1.description);
    const entities2 = this.extractEntities(event2.title + ' ' + event2.description);
    
    return entities1.filter(e => entities2.includes(e));
  }

  // 查找共同关键词
  private findCommonKeywords(event1: any, event2: any): string[] {
    const keywords1 = event1.keywords || [];
    const keywords2 = event2.keywords || [];
    
    return keywords1.filter((k: string) => keywords2.includes(k));
  }

  // 构建事件关联图
  async buildCorrelationGraph(events: any[]): Promise<CorrelationGraph> {
    const nodes: GraphNode[] = events.map(event => ({
      id: event._id,
      title: event.title,
      category: event.category,
      importance: event.importance,
      createdAt: event.createdAt
    }));

    const edges: GraphEdge[] = [];
    
    // 计算所有事件对的关联度
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const correlation = this.calculateCorrelation(events[i], events[j]);
        
        if (correlation.score > 0.4) { // 强关联阈值
          edges.push({
            source: events[i]._id,
            target: events[j]._id,
            weight: correlation.score,
            type: correlation.type,
            explanation: correlation.explanation
          });
        }
      }
    }

    return {
      nodes,
      edges,
      stats: this.calculateGraphStats(nodes, edges)
    };
  }

  // 计算图统计信息
  private calculateGraphStats(nodes: GraphNode[], edges: GraphEdge[]): GraphStats {
    const degreeMap = new Map<string, number>();
    
    // 计算节点度数
    nodes.forEach(node => degreeMap.set(node.id, 0));
    edges.forEach(edge => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    });

    const degrees = Array.from(degreeMap.values());
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    
    // 找出核心节点（度数最高的节点）
    const maxDegree = Math.max(...degrees);
    const coreNodes = nodes.filter(node => degreeMap.get(node.id) === maxDegree);

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      avgDegree: Math.round(avgDegree * 100) / 100,
      maxDegree,
      coreNodes: coreNodes.map(node => node.id),
      density: (2 * edges.length) / (nodes.length * (nodes.length - 1))
    };
  }

  // 发现事件集群
  async findEventClusters(events: any[]): Promise<EventCluster[]> {
    const graph = await this.buildCorrelationGraph(events);
    const clusters: EventCluster[] = [];
    const visited = new Set<string>();

    // 使用简化的社区发现算法
    graph.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.expandCluster(node.id, graph, visited);
        if (cluster.members.length >= 2) {
          clusters.push(cluster);
        }
      }
    });

    return clusters.sort((a, b) => b.members.length - a.members.length);
  }

  // 扩展集群
  private expandCluster(startNodeId: string, graph: CorrelationGraph, visited: Set<string>): EventCluster {
    const members: string[] = [];
    const queue: string[] = [startNodeId];
    const clusterEdges: GraphEdge[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      members.push(nodeId);

      // 查找强关联的邻居节点
      const connectedEdges = graph.edges.filter(edge => 
        (edge.source === nodeId || edge.target === nodeId) && edge.weight > 0.5
      );

      connectedEdges.forEach(edge => {
        clusterEdges.push(edge);
        const neighbor = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    const memberNodes = graph.nodes.filter(node => members.includes(node.id));
    const avgImportance = memberNodes.reduce((sum, node) => sum + node.importance, 0) / memberNodes.length;

    return {
      id: `cluster_${startNodeId}`,
      members,
      theme: this.identifyClusterTheme(memberNodes),
      strength: this.calculateClusterStrength(clusterEdges),
      avgImportance,
      description: this.generateClusterDescription(memberNodes, clusterEdges.length)
    };
  }

  // 识别集群主题
  private identifyClusterTheme(nodes: GraphNode[]): string {
    const categories = nodes.map(node => node.category);
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantCategory = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])[0][0];

    return dominantCategory;
  }

  // 计算集群强度
  private calculateClusterStrength(edges: GraphEdge[]): number {
    if (edges.length === 0) return 0;
    const avgWeight = edges.reduce((sum, edge) => sum + edge.weight, 0) / edges.length;
    return Math.round(avgWeight * 100) / 100;
  }

  // 生成集群描述
  private generateClusterDescription(nodes: GraphNode[], edgeCount: number): string {
    const theme = this.identifyClusterTheme(nodes);
    return `${theme}相关事件集群，包含${nodes.length}个事件，${edgeCount}个关联关系`;
  }

  // 预测事件发展
  async predictEventDevelopment(targetEvent: any, relatedEvents: any[]): Promise<DevelopmentPrediction> {
    const correlations = await this.findRelatedEvents(targetEvent, relatedEvents, 5);
    
    // 分析相关事件的发展模式
    const patterns = this.analyzeRelatedEventPatterns(correlations);
    
    const prediction: DevelopmentPrediction = {
      eventId: targetEvent._id,
      likelihood: this.calculateLikelihood(patterns),
      expectedOutcomes: this.generateExpectedOutcomes(patterns),
      timeframe: this.estimateTimeframe(patterns),
      confidence: this.calculatePredictionConfidence(correlations),
      influencingFactors: this.identifyInfluencingFactors(correlations),
      recommendations: this.generateRecommendations(targetEvent, patterns)
    };

    return prediction;
  }

  // 分析相关事件模式
  private analyzeRelatedEventPatterns(correlations: CorrelationResult[]): EventPattern[] {
    return correlations.map(corr => {
      const event = corr.relatedEvent;
      const timelineLength = event.timeline?.length || 0;
      const avgTimeInterval = this.calculateAvgTimeInterval(event.timeline || []);
      
      return {
        eventId: event._id,
        resolution: event.status,
        timelineLength,
        avgTimeInterval,
        finalOutcome: this.determineFinalOutcome(event)
      };
    });
  }

  // 计算平均时间间隔
  private calculateAvgTimeInterval(timeline: any[]): number {
    if (timeline.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < timeline.length; i++) {
      const prev = new Date(timeline[i-1].date);
      const curr = new Date(timeline[i].date);
      intervals.push((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  // 确定最终结果
  private determineFinalOutcome(event: any): string {
    if (event.status === 'resolved') {
      const lastTimeline = event.timeline?.[event.timeline.length - 1];
      if (lastTimeline?.type === 'resolution') {
        return 'positive_resolution';
      }
    }
    return 'ongoing';
  }

  // 计算可能性
  private calculateLikelihood(patterns: EventPattern[]): number {
    if (patterns.length === 0) return 0.5;
    
    const resolvedCount = patterns.filter(p => p.resolution === 'resolved').length;
    return resolvedCount / patterns.length;
  }

  // 生成预期结果
  private generateExpectedOutcomes(patterns: EventPattern[]): string[] {
    const outcomes = ['官方回应', '调查启动', '问题解决', '政策调整'];
    return outcomes.slice(0, Math.min(3, patterns.length + 1));
  }

  // 估计时间框架
  private estimateTimeframe(patterns: EventPattern[]): string {
    if (patterns.length === 0) return '无法预测';
    
    const avgTimelineLength = patterns.reduce((sum, p) => sum + p.timelineLength, 0) / patterns.length;
    const avgInterval = patterns.reduce((sum, p) => sum + p.avgTimeInterval, 0) / patterns.length;
    
    const estimatedDays = avgTimelineLength * avgInterval;
    
    if (estimatedDays < 7) return '1周内';
    if (estimatedDays < 30) return '1个月内';
    if (estimatedDays < 90) return '3个月内';
    return '3个月以上';
  }

  // 计算预测置信度
  private calculatePredictionConfidence(correlations: CorrelationResult[]): number {
    if (correlations.length === 0) return 0.1;
    
    const avgCorrelation = correlations.reduce((sum, c) => sum + c.score, 0) / correlations.length;
    return Math.min(0.9, avgCorrelation + 0.2);
  }

  // 识别影响因素
  private identifyInfluencingFactors(correlations: CorrelationResult[]): string[] {
    const factors = new Set<string>();
    
    correlations.forEach(corr => {
      if (corr.breakdown.entity > 0.3) factors.add('相关机构态度');
      if (corr.breakdown.category > 0.5) factors.add('同类事件处理先例');
      if (corr.breakdown.time > 0.6) factors.add('时间敏感性');
      if (corr.breakdown.sentiment > 0.4) factors.add('公众情感反应');
    });
    
    return Array.from(factors);
  }

  // 生成建议
  private generateRecommendations(targetEvent: any, patterns: EventPattern[]): string[] {
    const recommendations = [];
    
    if (targetEvent.importance > 7) {
      recommendations.push('建议密切关注事态发展');
    }
    
    if (patterns.some(p => p.avgTimeInterval < 3)) {
      recommendations.push('事件发展较快，需要及时跟进');
    }
    
    if (patterns.filter(p => p.resolution === 'resolved').length > patterns.length * 0.7) {
      recommendations.push('基于历史数据，该类事件通常能得到妥善解决');
    }
    
    return recommendations;
  }
}

// 类型定义
export interface Correlation {
  score: number;
  breakdown: {
    keyword: number;
    category: number;
    time: number;
    entity: number;
    sentiment: number;
  };
  type: CorrelationType;
  explanation: string;
}

export interface CorrelationResult extends Correlation {
  relatedEvent: any;
}

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  importance: number;
  createdAt: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: CorrelationType;
  explanation: string;
}

export interface CorrelationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  coreNodes: string[];
  density: number;
}

export interface EventCluster {
  id: string;
  members: string[];
  theme: string;
  strength: number;
  avgImportance: number;
  description: string;
}

export interface EventPattern {
  eventId: string;
  resolution: string;
  timelineLength: number;
  avgTimeInterval: number;
  finalOutcome: string;
}

export interface DevelopmentPrediction {
  eventId: string;
  likelihood: number;
  expectedOutcomes: string[];
  timeframe: string;
  confidence: number;
  influencingFactors: string[];
  recommendations: string[];
}

export type CorrelationType = 
  | 'entity_based'      // 基于实体关联
  | 'thematic'          // 主题关联
  | 'temporal'          // 时间关联
  | 'categorical'       // 分类关联
  | 'categorical_temporal' // 分类+时间关联
  | 'weak';             // 弱关联