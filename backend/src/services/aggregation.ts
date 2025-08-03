import axios from 'axios';
import { Event } from '../models/Event';

interface NewsAPIResponse {
  articles: Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: {
      name: string;
    };
  }>;
}

interface AggregatedData {
  source: string;
  items: Array<{
    title: string;
    description?: string;
    link?: string;
    publishedAt?: string;
    relevanceScore: number;
  }>;
}

// 多平台数据整合服务
export class DataAggregationService {
  private static instance: DataAggregationService;
  
  private constructor() {}
  
  public static getInstance(): DataAggregationService {
    if (!DataAggregationService.instance) {
      DataAggregationService.instance = new DataAggregationService();
    }
    return DataAggregationService.instance;
  }
  
  // 聚合多个平台的数据
  async aggregateFromMultipleSources(): Promise<AggregatedData[]> {
    const sources = [
      this.getWeiboHotSearch(),
      this.getBaiduHotSearch(),
      this.getToutiaoNews(),
      this.getZhihuHotlist(),
      this.getNewsAPIData()
    ];
    
    const results = await Promise.allSettled(sources);
    const aggregatedData: AggregatedData[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        aggregatedData.push(result.value);
      } else {
        console.warn(`Failed to fetch data from source ${index}:`, result.reason);
      }
    });
    
    return aggregatedData;
  }
  
  // 微博热搜数据
  private async getWeiboHotSearch(): Promise<AggregatedData> {
    try {
      // 更具体的热点事件模拟数据，包含你提到的事件
      const mockData = [
        { word: "武大杨景媛师生关系事件", num: 2345678 },
        { word: "协和董某医学教育争议", num: 1987654 },
        { word: "黄杨地铁耳环偷拍事件", num: 1765432 },
        { word: "哈佛蒋某学术争议", num: 1543210 },
        { word: "董宇辉东方甄选风波", num: 1432109 },
        { word: "教育改革最新政策讨论", num: 1234567 },
        { word: "医院医疗事故调查进展", num: 987654 },
        { word: "大学校园安全管理措施", num: 876543 },
        { word: "地铁公共场所安全监管", num: 765432 },
        { word: "师德师风建设新规范", num: 654321 }
      ];
      
      const items = mockData.map(item => ({
        title: item.word,
        description: `微博热搜话题：${item.word}，引发${item.num}次讨论`,
        link: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
        relevanceScore: this.calculateRelevanceScore(item.word, item.num)
      }));
      
      return {
        source: '微博热搜',
        items
      };
    } catch (error) {
      console.error('Error fetching Weibo data:', error);
      return { source: '微博热搜', items: [] };
    }
  }
  
  // 百度热搜数据
  private async getBaiduHotSearch(): Promise<AggregatedData> {
    try {
      const mockData = [
        { word: "协和医学院教育模式争议", hotScore: 2345678, desc: "医学教育改革引发讨论" },
        { word: "成都公共安全管理", hotScore: 1876543, desc: "地铁安全措施加强" },
        { word: "高校师生关系规范", hotScore: 1543210, desc: "武汉大学事件后续" },
        { word: "医疗行业监管加强", hotScore: 1234567, desc: "多地医院整改" }
      ];
      
      const items = mockData.map(item => ({
        title: item.word,
        description: item.desc,
        link: `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
        relevanceScore: this.calculateRelevanceScore(item.word, item.hotScore)
      }));
      
      return {
        source: '百度热搜',
        items
      };
    } catch (error) {
      console.error('Error fetching Baidu data:', error);
      return { source: '百度热搜', items: [] };
    }
  }
  
  // 今日头条新闻
  private async getToutiaoNews(): Promise<AggregatedData> {
    try {
      const mockData = [
        {
          title: "多地医学院校教育改革引发关注",
          abstract: "继协和医学院事件后，多地医学院校开始反思现有教育模式",
          group_id: "7123456789"
        },
        {
          title: "公共场所安全监管持续加强",
          abstract: "地铁、公交等公共交通工具安全措施全面升级",
          group_id: "7234567890"
        },
        {
          title: "高等教育师生关系新规范出台",
          abstract: "教育部门发布新的师生关系管理指导意见",
          group_id: "7345678901"
        }
      ];
      
      const items = mockData.map(item => ({
        title: item.title,
        description: item.abstract,
        link: `https://www.toutiao.com/article/${item.group_id}/`,
        relevanceScore: this.calculateRelevanceScore(item.title + " " + item.abstract)
      }));
      
      return {
        source: '今日头条',
        items
      };
    } catch (error) {
      console.error('Error fetching Toutiao data:', error);
      return { source: '今日头条', items: [] };
    }
  }
  
  // 知乎热榜
  private async getZhihuHotlist(): Promise<AggregatedData> {
    try {
      const mockData = [
        {
          title: "如何看待医学教育4+4模式的争议？",
          excerpt: "协和医学院事件引发的教育模式讨论",
          heat_value: 3456789
        },
        {
          title: "公共场所隐私保护有哪些改进空间？",
          excerpt: "从地铁偷拍事件谈隐私保护",
          heat_value: 2345678
        },
        {
          title: "大学师生关系应该如何规范？",
          excerpt: "武汉大学事件的反思与讨论",
          heat_value: 1987654
        }
      ];
      
      const items = mockData.map(item => ({
        title: item.title,
        description: item.excerpt,
        link: `https://www.zhihu.com/question/search?q=${encodeURIComponent(item.title)}`,
        relevanceScore: this.calculateRelevanceScore(item.title + " " + item.excerpt, item.heat_value)
      }));
      
      return {
        source: '知乎热榜',
        items
      };
    } catch (error) {
      console.error('Error fetching Zhihu data:', error);
      return { source: '知乎热榜', items: [] };
    }
  }
  
  // 第三方新闻API（如果有API密钥）
  private async getNewsAPIData(): Promise<AggregatedData> {
    try {
      // 这里可以集成真实的新闻API，比如NewsAPI、聚合数据等
      const mockData = [
        {
          title: "教育部回应医学教育改革质疑",
          description: "针对近期协和医学院等事件，教育部发布官方回应",
          url: "https://news.example.com/education-reform",
          publishedAt: new Date().toISOString(),
          source: { name: "教育新闻网" }
        },
        {
          title: "交通部门加强公共场所安全监管",
          description: "多地地铁、公交系统升级安全措施",
          url: "https://news.example.com/transport-safety",
          publishedAt: new Date().toISOString(),
          source: { name: "交通新闻网" }
        }
      ];
      
      const items = mockData.map(article => ({
        title: article.title,
        description: article.description,
        link: article.url,
        publishedAt: article.publishedAt,
        relevanceScore: this.calculateRelevanceScore(article.title + " " + article.description)
      }));
      
      return {
        source: '新闻API',
        items
      };
    } catch (error) {
      console.error('Error fetching News API data:', error);
      return { source: '新闻API', items: [] };
    }
  }
  
  // 计算内容相关性分数
  private calculateRelevanceScore(text: string, hotness?: number): number {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // 基于具体热点事件的高权重关键词
    const hotEventKeywords = [
      '武大杨景媛', '杨景媛', '协和董', '黄杨耳环', '哈佛蒋', 
      '董宇辉', '东方甄选', '俞敏洪'
    ];
    
    // 基于通用社会事件关键词的相关性
    const socialKeywords = [
      '协和', '医学院', '教育改革', '偷拍', '地铁', '安全',
      '武汉大学', '师生关系', '校园', '医院',
      '事件', '案件', '调查', '争议', '纠纷', '风波',
      '师德师风', '学术诚信', '隐私保护', '公共安全'
    ];
    
    // 热点事件关键词给予更高分数
    hotEventKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 25; // 高权重
      }
    });
    
    // 通用社会关键词
    socialKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        score += 10;
      }
    });
    
    // 基于热度的相关性
    if (hotness) {
      if (hotness > 2000000) score += 25;
      else if (hotness > 1000000) score += 20;
      else if (hotness > 500000) score += 15;
      else if (hotness > 100000) score += 10;
      else if (hotness > 50000) score += 5;
    }
    
    // 基于文本质量的相关性
    if (text.length > 10 && text.length < 200) score += 5;
    if (text.includes('最新') || text.includes('进展') || text.includes('回应')) score += 5;
    
    return Math.min(score, 100);
  }
  
  // 数据去重和融合
  async deduplicateAndMerge(aggregatedData: AggregatedData[]): Promise<any[]> {
    const allItems = aggregatedData.flatMap(data => 
      data.items.map(item => ({ ...item, source: data.source }))
    );
    
    // 按相关性分数排序
    allItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // 去重逻辑
    const uniqueItems = [];
    const seenTitles = new Set();
    
    for (const item of allItems) {
      const titleKey = item.title.toLowerCase().slice(0, 20);
      
      if (!seenTitles.has(titleKey) && item.relevanceScore >= 20) {
        seenTitles.add(titleKey);
        uniqueItems.push(item);
        
        if (uniqueItems.length >= 15) break; // 限制数量
      }
    }
    
    return uniqueItems;
  }
  
  // 生成综合报告
  async generateDailyReport(): Promise<{
    summary: string;
    topEvents: any[];
    trends: string[];
  }> {
    const aggregatedData = await this.aggregateFromMultipleSources();
    const uniqueItems = await this.deduplicateAndMerge(aggregatedData);
    
    // 分析趋势
    const trends = this.analyzeTrends(uniqueItems);
    
    // 生成摘要
    const summary = this.generateSummary(uniqueItems, trends);
    
    return {
      summary,
      topEvents: uniqueItems.slice(0, 10),
      trends
    };
  }
  
  private analyzeTrends(items: any[]): string[] {
    const keywordCount = new Map<string, number>();
    
    items.forEach(item => {
      const text = (item.title + " " + (item.description || "")).toLowerCase();
      
      const keywords = ['教育', '医疗', '安全', '大学', '地铁', '协和', '武汉'];
      
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
        }
      });
    });
    
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => `${keyword}相关事件(${count})`);
  }
  
  private generateSummary(items: any[], trends: string[]): string {
    const totalItems = items.length;
    const topCategories = trends.slice(0, 3).join('、');
    
    return `今日共监测到${totalItems}个相关社会事件，主要集中在${topCategories}等领域。其中高关注度事件${items.filter(item => item.relevanceScore > 50).length}个，需要重点关注。`;
  }
}