// 情感分析服务
export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;
  
  // 情感词典
  private readonly sentimentDict = {
    // 积极情感词
    positive: [
      '好', '棒', '优秀', '成功', '胜利', '喜悦', '开心', '满意', '赞',
      '支持', '认可', '表扬', '称赞', '肯定', '积极', '正面', '进步',
      '改善', '提升', '增长', '发展', '创新', '突破', '成就', '荣誉',
      '希望', '乐观', '振奋', '鼓舞', '激励', '温暖', '感动', '幸福',
      '完善', '健全', '有效', '及时', '迅速', '高效', '专业', '负责'
    ],
    
    // 消极情感词
    negative: [
      '坏', '差', '糟糕', '失败', '失望', '愤怒', '生气', '不满', '批评',
      '指责', '谴责', '反对', '抗议', '质疑', '怀疑', '担心', '忧虑',
      '问题', '困难', '麻烦', '危机', '风险', '威胁', '损失', '伤害',
      '错误', '失误', '过失', '违法', '违规', '不当', '不合理', '不公',
      '腐败', '贪污', '欺诈', '造假', '泄露', '滥用', '恶劣', '严重',
      '紧急', '紧张', '混乱', '冲突', '纠纷', '争议', '分歧', '对立'
    ],
    
    // 中性词但有倾向性
    neutral_positive: [
      '报道', '发布', '公布', '宣布', '通知', '说明', '澄清', '回应',
      '调查', '核实', '确认', '证实', '处理', '解决', '改进', '整改'
    ],
    
    neutral_negative: [
      '曝光', '揭露', '爆料', '举报', '投诉', '抱怨', '质疑', '追问',
      '追责', '问责', '监督', '检查', '审查', '调查', '核查', '追踪'
    ]
  };

  // 情感强度修饰词
  private readonly intensifiers = {
    strong: ['非常', '十分', '极其', '特别', '相当', '太', '超级', '极度'],
    weak: ['有点', '稍微', '略微', '还算', '比较', '较为', '相对']
  };

  // 否定词
  private readonly negators = ['不', '没', '无', '非', '未', '别', '勿', '莫'];

  private constructor() {}

  public static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  // 分析文本情感
  analyzeSentiment(text: string): SentimentResult {
    const cleanText = this.preprocessText(text);
    const sentences = this.splitSentences(cleanText);
    
    let totalScore = 0;
    let sentenceCount = 0;
    const details: SentenceAnalysis[] = [];

    for (const sentence of sentences) {
      if (sentence.trim().length > 3) {
        const analysis = this.analyzeSentence(sentence);
        details.push(analysis);
        totalScore += analysis.score;
        sentenceCount++;
      }
    }

    const avgScore = sentenceCount > 0 ? totalScore / sentenceCount : 0;
    
    return {
      score: this.normalizeScore(avgScore),
      label: this.scoreToLabel(avgScore),
      confidence: this.calculateConfidence(details),
      details,
      keywords: this.extractEmotionalKeywords(text),
      summary: this.generateSentimentSummary(avgScore, details)
    };
  }

  // 批量分析
  analyzeBatch(texts: string[]): SentimentResult[] {
    return texts.map(text => this.analyzeSentiment(text));
  }

  // 分析单个句子
  private analyzeSentence(sentence: string): SentenceAnalysis {
    const words = this.segmentWords(sentence);
    let score = 0;
    let posCount = 0;
    let negCount = 0;
    let keyWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const prevWord = i > 0 ? words[i - 1] : '';
      const nextWord = i < words.length - 1 ? words[i + 1] : '';

      // 检查情感词
      let wordScore = this.getWordSentiment(word);
      
      if (wordScore !== 0) {
        keyWords.push(word);
        
        // 检查否定词
        if (this.negators.includes(prevWord)) {
          wordScore *= -1;
        }
        
        // 检查强化词
        const intensity = this.getIntensity(prevWord) || this.getIntensity(nextWord);
        wordScore *= intensity;
        
        score += wordScore;
        
        if (wordScore > 0) posCount++;
        else negCount++;
      }
    }

    return {
      text: sentence,
      score,
      positiveCount: posCount,
      negativeCount: negCount,
      keywords: keyWords
    };
  }

  // 获取词语情感值
  private getWordSentiment(word: string): number {
    if (this.sentimentDict.positive.includes(word)) return 1;
    if (this.sentimentDict.negative.includes(word)) return -1;
    if (this.sentimentDict.neutral_positive.includes(word)) return 0.3;
    if (this.sentimentDict.neutral_negative.includes(word)) return -0.3;
    return 0;
  }

  // 获取强度修饰
  private getIntensity(word: string): number {
    if (this.intensifiers.strong.includes(word)) return 1.5;
    if (this.intensifiers.weak.includes(word)) return 0.7;
    return 1.0;
  }

  // 文本预处理
  private preprocessText(text: string): string {
    return text
      .replace(/[^\u4e00-\u9fa5\w\s.,!?;:]/g, '') // 保留中文、英文、数字和标点
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 分句
  private splitSentences(text: string): string[] {
    return text.split(/[。！？；\n]/).filter(s => s.trim().length > 0);
  }

  // 分词（简化版）
  private segmentWords(sentence: string): string[] {
    // 简单的中文分词逻辑
    const words: string[] = [];
    let currentWord = '';
    
    for (const char of sentence) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        if (currentWord && !/[\u4e00-\u9fa5]/.test(currentWord[currentWord.length - 1])) {
          words.push(currentWord);
          currentWord = '';
        }
        currentWord += char;
        
        // 检查是否是完整词语
        const allDictWords = [
          ...this.sentimentDict.positive,
          ...this.sentimentDict.negative,
          ...this.sentimentDict.neutral_positive,
          ...this.sentimentDict.neutral_negative,
          ...this.intensifiers.strong,
          ...this.intensifiers.weak,
          ...this.negators
        ];
        
        if (allDictWords.includes(currentWord)) {
          words.push(currentWord);
          currentWord = '';
        }
      } else if (/\w/.test(char)) {
        currentWord += char;
      } else {
        if (currentWord) {
          words.push(currentWord);
          currentWord = '';
        }
      }
    }
    
    if (currentWord) {
      words.push(currentWord);
    }
    
    return words.filter(word => word.length > 0);
  }

  // 标准化分数到-1到1之间
  private normalizeScore(score: number): number {
    return Math.max(-1, Math.min(1, score / 3));
  }

  // 分数转标签
  private scoreToLabel(score: number): SentimentLabel {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  // 计算置信度
  private calculateConfidence(details: SentenceAnalysis[]): number {
    if (details.length === 0) return 0;
    
    const totalWords = details.reduce((sum, d) => sum + d.keywords.length, 0);
    const avgWordsPerSentence = totalWords / details.length;
    
    // 基于情感词密度计算置信度
    const confidence = Math.min(0.9, avgWordsPerSentence * 0.3 + 0.1);
    return Math.round(confidence * 100) / 100;
  }

  // 提取情感关键词
  private extractEmotionalKeywords(text: string): string[] {
    const words = this.segmentWords(text);
    const emotionalWords: string[] = [];
    
    words.forEach(word => {
      if (this.getWordSentiment(word) !== 0) {
        emotionalWords.push(word);
      }
    });
    
    return [...new Set(emotionalWords)];
  }

  // 生成情感摘要
  private generateSentimentSummary(score: number, details: SentenceAnalysis[]): string {
    const label = this.scoreToLabel(score);
    const totalKeywords = details.reduce((sum, d) => sum + d.keywords.length, 0);
    
    switch (label) {
      case 'positive':
        return `文本整体情感偏向积极正面，包含${totalKeywords}个情感词汇，主要表达支持、肯定等态度。`;
      case 'negative':
        return `文本整体情感偏向消极负面，包含${totalKeywords}个情感词汇，主要表达批评、质疑等态度。`;
      default:
        return `文本情感相对中性，包含${totalKeywords}个情感词汇，表达客观叙述为主。`;
    }
  }

  // 事件情感趋势分析
  analyzeEventSentimentTrend(event: any): EventSentimentTrend {
    const timelineAnalysis = event.timeline.map((item: any) => {
      const sentiment = this.analyzeSentiment(item.content);
      return {
        date: item.date,
        sentiment: sentiment.score,
        label: sentiment.label,
        title: item.title
      };
    });

    // 计算整体趋势
    const scores = timelineAnalysis.map((t: any) => t.sentiment);
    const avgSentiment = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    
    // 计算趋势方向
    const trend = this.calculateTrend(scores);
    
    return {
      eventId: event._id,
      eventTitle: event.title,
      overallSentiment: avgSentiment,
      overallLabel: this.scoreToLabel(avgSentiment),
      trend,
      timelineAnalysis,
      summary: this.generateTrendSummary(avgSentiment, trend, timelineAnalysis.length)
    };
  }

  // 计算趋势方向
  private calculateTrend(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 2) return 'stable';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.2) return 'improving';
    if (difference < -0.2) return 'declining';
    return 'stable';
  }

  // 生成趋势摘要
  private generateTrendSummary(avgSentiment: number, trend: string, timelineLength: number): string {
    const sentimentLabel = this.scoreToLabel(avgSentiment);
    
    let trendText = '';
    switch (trend) {
      case 'improving':
        trendText = '情感态度有所改善';
        break;
      case 'declining':
        trendText = '情感态度趋于消极';
        break;
      default:
        trendText = '情感态度相对稳定';
    }
    
    return `基于${timelineLength}个时间节点的分析，事件整体情感${sentimentLabel === 'positive' ? '偏向积极' : sentimentLabel === 'negative' ? '偏向消极' : '相对中性'}，${trendText}。`;
  }

  // 获取情感统计
  getSentimentStats(events: any[]): SentimentStats {
    const allSentiments = events.map(event => {
      const sentiment = this.analyzeSentiment(event.title + ' ' + event.description);
      return { eventId: event._id, sentiment: sentiment.score, label: sentiment.label };
    });

    const stats = {
      total: allSentiments.length,
      positive: allSentiments.filter(s => s.label === 'positive').length,
      negative: allSentiments.filter(s => s.label === 'negative').length,
      neutral: allSentiments.filter(s => s.label === 'neutral').length,
      averageScore: allSentiments.reduce((sum, s) => sum + s.sentiment, 0) / allSentiments.length,
      distribution: {} as Record<string, number>
    };

    // 分数分布
    const ranges = [
      { label: '非常消极', min: -1, max: -0.6 },
      { label: '消极', min: -0.6, max: -0.3 },
      { label: '中性', min: -0.3, max: 0.3 },
      { label: '积极', min: 0.3, max: 0.6 },
      { label: '非常积极', min: 0.6, max: 1 }
    ];

    ranges.forEach(range => {
      stats.distribution[range.label] = allSentiments.filter(
        s => s.sentiment >= range.min && s.sentiment < range.max
      ).length;
    });

    return stats;
  }
}

// 类型定义
export interface SentimentResult {
  score: number; // -1 到 1
  label: SentimentLabel;
  confidence: number; // 0 到 1
  details: SentenceAnalysis[];
  keywords: string[];
  summary: string;
}

export interface SentenceAnalysis {
  text: string;
  score: number;
  positiveCount: number;
  negativeCount: number;
  keywords: string[];
}

export interface EventSentimentTrend {
  eventId: string;
  eventTitle: string;
  overallSentiment: number;
  overallLabel: SentimentLabel;
  trend: 'improving' | 'declining' | 'stable';
  timelineAnalysis: Array<{
    date: string;
    sentiment: number;
    label: SentimentLabel;
    title: string;
  }>;
  summary: string;
}

export interface SentimentStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  averageScore: number;
  distribution: Record<string, number>;
}

export type SentimentLabel = 'positive' | 'negative' | 'neutral';