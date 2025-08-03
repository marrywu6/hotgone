import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Event } from '../models/Event';
import { EventTimelineService } from './eventTimeline';

interface CrawlSource {
  name: string;
  url: string;
  type: 'api' | 'html';
  selectors?: {
    items: string;
    title: string;
    link?: string;
    description?: string;
    time?: string;
    hot?: string;
  };
  apiProcessor?: (data: any) => CrawlItem[];
  headers?: Record<string, string>;
}

interface CrawlItem {
  title: string;
  link?: string;
  description?: string;
  time?: string;
  hotness?: number;
  source: string;
}

const sources: CrawlSource[] = [
  // 微博热搜 - 使用实际可用的API
  {
    name: '微博热搜',
    url: 'https://weibo.com/ajax/side/hotSearch',
    type: 'api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://weibo.com/'
    },
    apiProcessor: (data: any) => {
      if (!data?.data?.realtime) return [];
      return data.data.realtime.slice(0, 20).map((item: any, index: number) => ({
        title: item.word || item.note,
        link: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word)}`,
        description: item.word,
        hotness: item.num || (1000000 - index * 10000),
        source: '微博热搜'
      }));
    }
  },
  
  // 百度热搜
  {
    name: '百度热搜',
    url: 'https://top.baidu.com/api/board?platform=wise&tab=realtime',
    type: 'api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://top.baidu.com/'
    },
    apiProcessor: (data: any) => {
      if (!data?.data?.cards?.[0]?.content) return [];
      return data.data.cards[0].content.slice(0, 20).map((item: any, index: number) => ({
        title: item.word,
        link: item.url,
        description: item.desc || item.word,
        hotness: item.hotScore || (1000000 - index * 10000),
        source: '百度热搜'
      }));
    }
  },

  // 今日头条热点
  {
    name: '今日头条',
    url: 'https://www.toutiao.com/api/pc/feed/',
    type: 'api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    apiProcessor: (data: any) => {
      if (!data?.data) return [];
      return data.data.slice(0, 15).map((item: any, index: number) => ({
        title: item.title,
        link: `https://www.toutiao.com/article/${item.group_id}/`,
        description: item.abstract || item.title,
        hotness: item.hot_value || (500000 - index * 5000),
        source: '今日头条'
      }));
    }
  },

  // 知乎热榜 - 备用HTML解析
  {
    name: '知乎热榜',
    url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total',
    type: 'api',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    apiProcessor: (data: any) => {
      if (!data?.data) return [];
      return data.data.slice(0, 15).map((item: any, index: number) => ({
        title: item.target?.title || item.title,
        link: item.target?.url,
        description: item.target?.excerpt || item.detail_text,
        hotness: item.heat_value || (800000 - index * 8000),
        source: '知乎热榜'
      }));
    }
  }
];

export async function crawlEvents(): Promise<void> {
  console.log('Starting enhanced event crawling...');
  
  const allItems: CrawlItem[] = [];
  
  // 并行爬取所有数据源
  const crawlPromises = sources.map(source => crawlSource(source));
  const results = await Promise.allSettled(crawlPromises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      console.log(`Successfully crawled ${sources[index].name}: ${result.value.length} items`);
    } else {
      console.error(`Failed to crawl ${sources[index].name}:`, result.reason.message);
    }
  });
  
  console.log(`Total items collected: ${allItems.length}`);
  
  // 处理收集到的数据
  const socialEvents = filterSocialEvents(allItems);
  console.log(`Social events identified: ${socialEvents.length}`);
  
  // 按重要性排序并处理
  socialEvents.sort((a, b) => (b.hotness || 0) - (a.hotness || 0));
  
  for (const item of socialEvents.slice(0, 10)) { // 只处理前10个最热门的
    await processEvent(item);
  }
}

async function crawlSource(source: CrawlSource): Promise<CrawlItem[]> {
  try {
    if (source.type === 'api') {
      return await crawlApiSource(source);
    } else {
      return await crawlHtmlSource(source);
    }
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error);
    return [];
  }
}

async function crawlApiSource(source: CrawlSource): Promise<CrawlItem[]> {
  try {
    const response = await axios.get(source.url, {
      headers: source.headers,
      timeout: 10000
    });
    
    if (source.apiProcessor) {
      return source.apiProcessor(response.data);
    }
    return [];
  } catch (error) {
    // API失败时的fallback机制
    console.warn(`API crawling failed for ${source.name}, error:`, error);
    return [];
  }
}

async function crawlHtmlSource(source: CrawlSource): Promise<CrawlItem[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(source.url, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const items: CrawlItem[] = [];
    
    if (source.selectors) {
      $(source.selectors.items).each((index, element) => {
        const $item = $(element);
        const title = $item.find(source.selectors!.title).text().trim();
        
        if (title && title.length > 3) {
          const link = source.selectors!.link ? 
            $item.find(source.selectors!.link).attr('href') : '';
          const description = source.selectors!.description ? 
            $item.find(source.selectors!.description).text().trim() : title;
          
          items.push({
            title,
            link: link ? normalizeUrl(link, source.url) : '',
            description,
            hotness: 100000 - index * 1000,
            source: source.name
          });
        }
      });
    }
    
    return items;
  } finally {
    await browser.close();
  }
}

function filterSocialEvents(items: CrawlItem[]): CrawlItem[] {
  return items.filter(item => {
    const title = item.title.toLowerCase();
    const description = (item.description || '').toLowerCase();
    const text = title + ' ' + description;
    
    // 增强的社会事件识别逻辑
    const hasSocialKeywords = checkSocialKeywords(text);
    const hasExcludeKeywords = checkExcludeKeywords(text);
    const hasQualityIndicators = checkQualityIndicators(text);
    
    // 综合评分
    let score = 0;
    if (hasSocialKeywords) score += 3;
    if (hasQualityIndicators) score += 2;
    if (hasExcludeKeywords) score -= 5;
    
    // 标题长度和内容质量检查
    if (title.length < 4 || title.length > 100) score -= 2;
    if (isSpamContent(text)) score -= 10;
    
    return score >= 2;
  });
}

function checkSocialKeywords(text: string): boolean {
  const socialKeywords = [
    // 具体热点人物和事件
    '黄杨', '耳环', '哈佛蒋', '协和董', '武大杨景媛', '杨景媛',
    '董宇辉', '东方甄选', '俞敏洪', '新东方',
    
    // 教育相关
    '协和', '医学院', '教育改革', '学生', '师生', '校园',
    '大学', '高校', '教师', '学校', '考试', '招生',
    '清华', '北大', '复旦', '交大', '中科大', '浙大',
    
    // 社会事件
    '事件', '案件', '调查', '处理', '回应', '声明', '澄清',
    '道歉', '处罚', '判决', '起诉', '举报', '曝光', '爆料',
    '舆论', '争议', '风波', '危机', '丑闻',
    
    // 安全相关  
    '偷拍', '骚扰', '性侵', '暴力', '威胁', '欺凌',
    '安全', '隐私', '保护', '维权', '投诉', '举报',
    
    // 医疗相关
    '医院', '医生', '患者', '医疗', '诊断', '治疗',
    '药物', '疫苗', '手术', '急救', '医患',
    
    // 社会问题
    '腐败', '贪污', '违法', '违规', '失职', '渎职',
    '欺诈', '造假', '泄露', '滥用', '不当', '违纪',
    
    // 公共安全
    '地铁', '公交', '交通', '火车', '飞机', '地震',
    '火灾', '爆炸', '中毒', '事故', '灾害', '安全事故',
    
    // 社会关注
    '维权', '抗议', '示威', '罢工', '冲突', '纠纷',
    '争议', '质疑', '批评', '抨击', '谴责',
    
    // 网络热词和社会现象
    '社会责任', '道德底线', '公序良俗', '社会影响',
    '公众人物', '网红', '带货', '直播', '流量',
    '社会热点', '民生', '就业', '住房', '教育公平'
  ];
  
  return socialKeywords.some(keyword => text.includes(keyword));
}

function checkExcludeKeywords(text: string): boolean {
  const excludeKeywords = [
    // 娱乐内容
    '明星', '演员', '歌手', '网红', '主播', '直播',
    '电影', '电视剧', '综艺', '音乐', '演唱会', '粉丝',
    
    // 体育内容
    '比赛', '足球', '篮球', '游戏', '电竞', '世界杯',
    '奥运', '锦标赛', '联赛', '球员', '教练',
    
    // 商业广告
    '促销', '打折', '优惠', '购买', '商品', '品牌',
    '发布', '上市', '新品', '限时', '秒杀',
    
    // 天气股市
    '天气', '气温', '降雨', '台风', '股价', '涨跌',
    '市场', '基金', '理财', '投资',
    
    // 技术产品
    'iphone', 'ipad', '手机', '电脑', 'app', '软件',
    '科技', '互联网', '人工智能', 'ai'
  ];
  
  return excludeKeywords.some(keyword => text.includes(keyword));
}

function checkQualityIndicators(text: string): boolean {
  const qualityKeywords = [
    '官方', '教育部', '卫健委', '公安', '警方', '法院',
    '检察院', '政府', '部门', '机构', '组织', '协会',
    '大学', '医院', '学校', '企业', '公司', '单位'
  ];
  
  return qualityKeywords.some(keyword => text.includes(keyword));
}

function isSpamContent(text: string): boolean {
  // 检查垃圾内容特征
  const spamPatterns = [
    /(.)\1{3,}/, // 重复字符
    /[！。]{3,}/, // 重复标点
    /^\d+$/, // 纯数字
    /^[a-zA-Z]+$/, // 纯英文
    /微信|qq|电话|联系/i, // 联系方式
    /加群|扫码|关注|点赞/i // 营销用词
  ];
  
  return spamPatterns.some(pattern => pattern.test(text));
}

function extractKeywords(title: string, description?: string): string[] {
  const text = title + ' ' + (description || '');
  const keywords: string[] = [];
  
  // 实体识别关键词库
  const entityKeywords = {
    // 机构实体
    institutions: [
      '协和医学院', '协和医院', '北京协和', '清华大学', '北京大学',
      '武汉大学', '复旦大学', '上海交大', '中山大学', '华为',
      '腾讯', '阿里巴巴', '百度', '字节跳动', '美团',
      '东方甄选', '新东方', '俞敏洪公司'
    ],
    
    // 地点实体
    locations: [
      '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉',
      '西安', '南京', '重庆', '天津', '苏州', '郑州', '长沙',
      '哈佛', '剑桥', '牛津', '麻省理工'
    ],
    
    // 事件类型
    eventTypes: [
      '医疗事故', '教育改革', '学术造假', '性骚扰', '偷拍事件',
      '校园霸凌', '医患纠纷', '食品安全', '环境污染', '安全事故',
      '师生关系事件', '耳环事件', '直播风波', '商业纠纷'
    ],
    
    // 关键人物类型
    roles: [
      '教授', '医生', '学生', '患者', '校长', '院长', '董事长',
      '总经理', '主任', '科长', '警察', '法官', '律师',
      '主播', '网红', '公众人物', '知名人士'
    ],
    
    // 热点人物关键词
    hotPersons: [
      '黄杨', '杨景媛', '武大杨景媛', '董宇辉', '协和董',
      '哈佛蒋', '俞敏洪', '东方甄选主播'
    ]
  };
  
  // 提取实体关键词
  Object.values(entityKeywords).forEach(categoryKeywords => {
    categoryKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });
  });
  
  // 基于规则的关键词提取
  const ruleBasedKeywords = extractRuleBasedKeywords(text);
  keywords.push(...ruleBasedKeywords);
  
  // 去重并返回
  return [...new Set(keywords)].slice(0, 8);
}

function extractRuleBasedKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // 提取组织机构名
  const institutionPattern = /([\u4e00-\u9fa5]{2,})(大学|学院|医院|公司|集团|银行|局|部|委|会)/g;
  let match;
  while ((match = institutionPattern.exec(text)) !== null) {
    keywords.push(match[0]);
  }
  
  // 提取专业术语
  const termPattern = /([\u4e00-\u9fa5]{2,})(事件|案件|问题|争议|纠纷|冲突|危机)/g;
  while ((match = termPattern.exec(text)) !== null) {
    keywords.push(match[1] + match[2]);
  }
  
  // 提取数字+单位的重要信息
  const numberPattern = /(\d+)(人|名|个|起|件|万|亿|元)/g;
  while ((match = numberPattern.exec(text)) !== null) {
    if (parseInt(match[1]) > 10) { // 只提取大于10的数字
      keywords.push(match[0]);
    }
  }
  
  return keywords;
}

function calculateImportance(item: CrawlItem): number {
  let importance = 1;
  
  const title = item.title.toLowerCase();
  const description = (item.description || '').toLowerCase();
  const text = title + ' ' + description;
  
  // 基于热度的重要性
  if (item.hotness) {
    if (item.hotness > 1000000) importance += 4;
    else if (item.hotness > 500000) importance += 3;
    else if (item.hotness > 100000) importance += 2;
    else if (item.hotness > 50000) importance += 1;
  }
  
  // 基于关键词的重要性
  const highImportanceKeywords = [
    '协和', '武大', '清华', '北大', '重大事故', '重大案件',
    '涉及', '多人', '死亡', '受伤', '失踪', '爆炸', '火灾',
    // 新增热点人物和事件
    '黄杨', '杨景媛', '董宇辉', '哈佛蒋', '协和董',
    '东方甄选', '俞敏洪', '耳环', '师生关系',
    '社会影响', '舆论关注', '网络热议', '公众关注'
  ];
  
  const mediumImportanceKeywords = [
    '调查', '处罚', '回应', '声明', '澄清', '道歉',
    '学校', '医院', '警方', '官方', '教育部',
    '处理结果', '后续进展', '相关部门'
  ];
  
  highImportanceKeywords.forEach(keyword => {
    if (text.includes(keyword)) importance += 3;
  });
  
  mediumImportanceKeywords.forEach(keyword => {
    if (text.includes(keyword)) importance += 1;
  });
  
  // 基于来源的重要性调整
  if (item.source === '微博热搜') importance += 1;
  if (item.source === '百度热搜') importance += 1;
  
  return Math.min(importance, 10);
}

function normalizeUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  
  try {
    const base = new URL(baseUrl);
    return new URL(url, base.origin).toString();
  } catch {
    return url;
  }
}

async function processEvent(item: CrawlItem): Promise<void> {
  try {
    const keywords = extractKeywords(item.title, item.description);
    const importance = calculateImportance(item);
    
    // 检查是否已存在相似事件（增强的去重逻辑）
    const existingEvent = await findSimilarEvent(item, keywords);
    
    if (existingEvent) {
      // 更新现有事件的时间线
      const newTimelineItem = {
        date: new Date(),
        title: `${item.source}报道更新`,
        content: item.description || item.title,
        source: item.link || '',
        type: 'development' as const
      };
      
      existingEvent.timeline.push(newTimelineItem);
      
      // 更新来源
      if (item.link && !existingEvent.sources.includes(item.link)) {
        existingEvent.sources.push(item.link);
      }
      
      // 更新关键词
      keywords.forEach(keyword => {
        if (!existingEvent.keywords.includes(keyword)) {
          existingEvent.keywords.push(keyword);
        }
      });
      
      // 更新重要性（取最高值）
      existingEvent.importance = Math.max(existingEvent.importance, importance);
      existingEvent.updatedAt = new Date();
      
      await existingEvent.save();
      
      // 使用事件时间线服务更新上下文
      const timelineService = EventTimelineService.getInstance();
      await timelineService.updateEventContext(
        existingEvent._id.toString(), 
        item.description || item.title, 
        item.link
      );
      
      console.log(`Updated existing event: ${existingEvent.title}`);
    } else {
      // 创建新事件
      const newEvent = new Event({
        title: item.title,
        description: item.description || item.title,
        category: categorizeEvent(item.title, item.description),
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
      
      // 为重要事件生成详细分析
      if (importance > 7) {
        const timelineService = EventTimelineService.getInstance();
        const summary = await timelineService.generateEventSummary(newEvent._id.toString());
        console.log(`Event summary generated for: ${newEvent.title}`);
        console.log(summary);
      }
    }
  } catch (error) {
    console.error('Error processing event:', error);
  }
}

async function findSimilarEvent(item: CrawlItem, keywords: string[]): Promise<any> {
  // 多种相似度检测方法
  
  // 1. 精确标题匹配
  let existing = await Event.findOne({
    title: { $regex: item.title.slice(0, 15), $options: 'i' }
  });
  
  if (existing) return existing;
  
  // 2. 关键词匹配
  if (keywords.length > 0) {
    existing = await Event.findOne({
      keywords: { $in: keywords.slice(0, 3) }
    });
    
    if (existing) {
      // 计算相似度
      const similarity = calculateSimilarity(item.title, existing.title);
      if (similarity > 0.6) return existing;
    }
  }
  
  // 3. 语义相似度检测（简化版）
  const recentEvents = await Event.find({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).limit(20);
  
  for (const event of recentEvents) {
    const similarity = calculateSimilarity(item.title, event.title);
    if (similarity > 0.7) {
      return event;
    }
  }
  
  return null;
}

function calculateSimilarity(str1: string, str2: string): number {
  // 简化的字符串相似度计算
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function categorizeEvent(title: string, description?: string): string {
  const text = (title + ' ' + (description || '')).toLowerCase();
  
  const categories = {
    '教育医疗': ['协和', '医学院', '大学', '学校', '教育', '医院', '医疗', '学生', '教师'],
    '社会安全': ['偷拍', '骚扰', '暴力', '安全', '地铁', '公交', '交通', '事故'],
    '法律案件': ['案件', '法院', '判决', '起诉', '犯罪', '违法', '警方', '调查'],
    '企业管理': ['公司', '企业', '员工', '管理', '辞退', '劳动', '工作'],
    '政府政策': ['政府', '政策', '法规', '部门', '官方', '行政', '监管'],
    '环境健康': ['环境', '污染', '食品', '药品', '健康', '卫生', '疫情'],
    '经济金融': ['经济', '金融', '银行', '投资', '股市', '房价', '消费'],
    '科技网络': ['科技', '网络', '互联网', '数据', '隐私', '信息', 'app']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return '社会事件';
}