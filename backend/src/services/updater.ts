import { Event } from '../models/Event';
import { crawlEvents } from './crawler';
import { DataAggregationService } from './aggregation';

export async function updateEventProgress(): Promise<void> {
  console.log('Starting enhanced event progress update...');
  
  try {
    // 使用增强的数据聚合服务
    const aggregationService = DataAggregationService.getInstance();
    
    // 生成日报
    const dailyReport = await aggregationService.generateDailyReport();
    console.log('Daily Summary:', dailyReport.summary);
    console.log('Top Trends:', dailyReport.trends);
    
    // 处理聚合的数据
    for (const item of dailyReport.topEvents) {
      await processAggregatedItem(item);
    }
    
    // 运行传统爬虫作为补充
    await crawlEvents();
    
    // 获取所有活跃事件进行更新
    const activeEvents = await Event.find({ 
      status: { $in: ['active', 'ongoing'] }
    });
    
    console.log(`Found ${activeEvents.length} active events to update`);
    
    // 检查长时间无更新的事件，标记为已解决
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const staleEvents = await Event.find({
      status: { $in: ['active', 'ongoing'] },
      updatedAt: { $lt: thirtyDaysAgo }
    });
    
    for (const event of staleEvents) {
      await markEventAsResolved(event);
    }
    
    // 分析和更新事件趋势
    await analyzeEventTrends();
    
    console.log('Enhanced event progress update completed');
    
  } catch (error) {
    console.error('Failed to update event progress:', error);
  }
}

async function processAggregatedItem(item: any): Promise<void> {
  try {
    // 检查是否为值得记录的社会事件
    if (!isSocialEventWorthy(item)) {
      return;
    }
    
    const keywords = extractKeywordsFromItem(item);
    const importance = calculateItemImportance(item);
    
    // 查找相似事件
    const existingEvent = await findSimilarEventByContent(item, keywords);
    
    if (existingEvent) {
      // 更新现有事件
      await updateExistingEvent(existingEvent, item);
    } else {
      // 创建新事件
      await createNewEventFromItem(item, keywords, importance);
    }
  } catch (error) {
    console.error('Error processing aggregated item:', error);
  }
}

function isSocialEventWorthy(item: any): boolean {
  const text = (item.title + ' ' + (item.description || '')).toLowerCase();
  
  // 社会事件关键词
  const socialKeywords = [
    '协和', '医学院', '教育改革', '偷拍', '地铁', '安全',
    '武汉大学', '师生关系', '校园', '医院', '事件', '案件',
    '调查', '争议', '纠纷', '处理', '回应', '声明'
  ];
  
  // 排除关键词
  const excludeKeywords = [
    '娱乐', '明星', '电影', '游戏', '体育', '比赛',
    '股票', '投资', '购物', '促销'
  ];
  
  const hasSocialKeywords = socialKeywords.some(keyword => text.includes(keyword));
  const hasExcludeKeywords = excludeKeywords.some(keyword => text.includes(keyword));
  
  return hasSocialKeywords && !hasExcludeKeywords && item.relevanceScore >= 20;
}

function extractKeywordsFromItem(item: any): string[] {
  const text = item.title + ' ' + (item.description || '');
  const keywords: string[] = [];
  
  // 实体提取
  const entities = [
    '协和医学院', '协和医院', '武汉大学', '清华大学', '北京大学',
    '成都地铁', '北京地铁', '上海地铁', '教育部', '卫健委',
    '医疗事故', '教育改革', '偷拍事件', '校园安全', '师生关系'
  ];
  
  entities.forEach(entity => {
    if (text.includes(entity)) {
      keywords.push(entity);
    }
  });
  
  // 从来源添加关键词
  if (item.source) {
    keywords.push(`来源:${item.source}`);
  }
  
  return [...new Set(keywords)].slice(0, 6);
}

function calculateItemImportance(item: any): number {
  let importance = 1;
  
  // 基于相关性分数
  if (item.relevanceScore > 80) importance += 4;
  else if (item.relevanceScore > 60) importance += 3;
  else if (item.relevanceScore > 40) importance += 2;
  else if (item.relevanceScore > 20) importance += 1;
  
  // 基于来源的权重
  const sourceWeights = {
    '微博热搜': 2,
    '百度热搜': 2,
    '知乎热榜': 1,
    '今日头条': 1,
    '新闻API': 3
  };
  
  if (item.source && sourceWeights[item.source]) {
    importance += sourceWeights[item.source];
  }
  
  return Math.min(importance, 10);
}

async function findSimilarEventByContent(item: any, keywords: string[]): Promise<any> {
  // 基于标题相似度
  const titleSimilarEvents = await Event.find({
    title: { $regex: item.title.slice(0, 15), $options: 'i' }
  });
  
  if (titleSimilarEvents.length > 0) {
    return titleSimilarEvents[0];
  }
  
  // 基于关键词匹配
  if (keywords.length > 0) {
    const keywordEvents = await Event.find({
      keywords: { $in: keywords }
    });
    
    if (keywordEvents.length > 0) {
      // 选择最相似的
      const bestMatch = keywordEvents.reduce((best, current) => {
        const currentSimilarity = calculateTextSimilarity(item.title, current.title);
        const bestSimilarity = calculateTextSimilarity(item.title, best.title);
        return currentSimilarity > bestSimilarity ? current : best;
      });
      
      if (calculateTextSimilarity(item.title, bestMatch.title) > 0.5) {
        return bestMatch;
      }
    }
  }
  
  return null;
}

function calculateTextSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = new Set([...words1, ...words2]).size;
  
  return totalWords > 0 ? commonWords.length / totalWords : 0;
}

async function updateExistingEvent(event: any, item: any): Promise<void> {
  // 添加新的时间线项
  const newTimelineItem = {
    date: new Date(),
    title: `${item.source}报道更新`,
    content: item.description || item.title,
    source: item.link || '',
    type: 'development' as const
  };
  
  event.timeline.push(newTimelineItem);
  
  // 更新来源
  if (item.link && !event.sources.includes(item.link)) {
    event.sources.push(item.link);
  }
  
  // 更新关键词
  const newKeywords = extractKeywordsFromItem(item);
  newKeywords.forEach(keyword => {
    if (!event.keywords.includes(keyword)) {
      event.keywords.push(keyword);
    }
  });
  
  // 更新重要性
  const newImportance = calculateItemImportance(item);
  event.importance = Math.max(event.importance, newImportance);
  
  event.updatedAt = new Date();
  await event.save();
  
  console.log(`Updated existing event: ${event.title}`);
}

async function createNewEventFromItem(item: any, keywords: string[], importance: number): Promise<void> {
  const category = categorizeByContent(item.title, item.description);
  
  const newEvent = new Event({
    title: item.title,
    description: item.description || item.title,
    category,
    status: 'active',
    timeline: [{
      date: new Date(),
      title: `${item.source}首次报道`,
      content: item.description || item.title,
      source: item.link || '',
      type: 'incident'
    }],
    sources: item.link ? [item.link] : [],
    keywords,
    importance
  });
  
  await newEvent.save();
  console.log(`Created new event: ${newEvent.title}`);
}

function categorizeByContent(title: string, description?: string): string {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  const categories = {
    '教育医疗': ['协和', '医学院', '大学', '学校', '教育', '医院', '医疗', '学生', '教师', '师生'],
    '社会安全': ['偷拍', '骚扰', '暴力', '安全', '地铁', '公交', '交通', '事故', '隐私'],
    '法律案件': ['案件', '法院', '判决', '起诉', '犯罪', '违法', '警方', '调查', '处罚'],
    '政府政策': ['政府', '政策', '法规', '部门', '官方', '行政', '监管', '回应', '声明'],
    '企业管理': ['公司', '企业', '员工', '管理', '工作', '职场', '劳动'],
    '环境健康': ['环境', '污染', '食品', '药品', '健康', '卫生', '疫情']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return '社会事件';
}

async function markEventAsResolved(event: any): Promise<void> {
  event.status = 'resolved';
  event.timeline.push({
    date: new Date(),
    title: '系统自动标记为已解决',
    content: '该事件30天内无新进展，系统自动标记为已解决状态',
    type: 'resolution'
  });
  
  await event.save();
  console.log(`Marked event as resolved: ${event.title}`);
}

export async function analyzeEventTrends(): Promise<void> {
  try {
    console.log('Analyzing event trends...');
    
    // 分析最近7天的事件趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEvents = await Event.find({
      updatedAt: { $gte: sevenDaysAgo }
    });
    
    // 分析关键词趋势
    const keywordTrends = analyzeKeywordTrends(recentEvents);
    console.log('Keyword trends:', keywordTrends);
    
    // 分析类别趋势
    const categoryTrends = analyzeCategoryTrends(recentEvents);
    console.log('Category trends:', categoryTrends);
    
    // 更新事件重要性
    for (const event of recentEvents) {
      const newImportance = calculateTrendBasedImportance(event, keywordTrends);
      if (newImportance !== event.importance) {
        event.importance = newImportance;
        await event.save();
      }
    }
    
    console.log('Event trend analysis completed');
    
  } catch (error) {
    console.error('Failed to analyze event trends:', error);
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
    if (trendCount > 5) importance += 1;
    else if (trendCount > 10) importance += 2;
  });
  
  // 基于时间线活跃度调整
  const recentTimelineItems = event.timeline.filter((item: any) => {
    const itemDate = new Date(item.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return itemDate > threeDaysAgo;
  });
  
  if (recentTimelineItems.length > 3) importance += 1;
  else if (recentTimelineItems.length === 0) importance -= 1;
  
  return Math.max(1, Math.min(importance, 10));
}