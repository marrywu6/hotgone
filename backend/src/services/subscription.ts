import { User, IUser, EventSubscription } from '../models/User';
import { Event } from '../models/Event';
import { SentimentAnalysisService } from './sentimentAnalysis';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private sentimentService: SentimentAnalysisService;

  private constructor() {
    this.sentimentService = SentimentAnalysisService.getInstance();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  // 创建或更新用户
  async createOrUpdateUser(userData: Partial<IUser>): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      Object.assign(existingUser, userData);
      existingUser.lastActiveAt = new Date();
      return await existingUser.save();
    }
    
    const newUser = new User({
      ...userData,
      preferences: {
        categories: ['教育医疗', '社会安全'],
        keywords: [],
        importance: 5,
        sentiment: ['negative', 'neutral'],
        regions: ['全国'],
        sources: ['微博热搜', '百度热搜'],
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        ...userData.preferences
      },
      notifications: {
        email: {
          enabled: true,
          frequency: 'daily',
          eventTypes: ['high_importance', 'subscribed_events']
        },
        push: {
          enabled: true,
          eventTypes: ['breaking_news', 'subscribed_events']
        },
        sms: {
          enabled: false,
          emergencyOnly: true
        },
        ...userData.notifications
      }
    });
    
    return await newUser.save();
  }

  // 添加事件订阅
  async addEventSubscription(userId: string, subscription: Partial<EventSubscription>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 检查是否已经订阅
    const existingSubscription = user.subscriptions.find(
      sub => sub.type === subscription.type && sub.value === subscription.value
    );

    if (existingSubscription) {
      existingSubscription.isActive = true;
      existingSubscription.createdAt = new Date();
    } else {
      user.subscriptions.push({
        ...subscription,
        createdAt: new Date(),
        isActive: true
      } as EventSubscription);
    }

    return await user.save();
  }

  // 移除事件订阅
  async removeEventSubscription(userId: string, subscriptionId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.subscriptions = user.subscriptions.filter(
      sub => sub._id?.toString() !== subscriptionId
    );

    return await user.save();
  }

  // 切换订阅状态
  async toggleSubscription(userId: string, subscriptionId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const subscription = user.subscriptions.find(
      sub => sub._id?.toString() === subscriptionId
    );

    if (subscription) {
      subscription.isActive = !subscription.isActive;
    }

    return await user.save();
  }

  // 批量订阅关键词
  async subscribeToKeywords(userId: string, keywords: string[]): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    for (const keyword of keywords) {
      const existingSubscription = user.subscriptions.find(
        sub => sub.type === 'keyword' && sub.value === keyword
      );

      if (!existingSubscription) {
        user.subscriptions.push({
          type: 'keyword',
          value: keyword,
          isActive: true,
          createdAt: new Date()
        } as EventSubscription);
      }
    }

    return await user.save();
  }

  // 订阅分类
  async subscribeToCategory(userId: string, category: string): Promise<IUser> {
    return await this.addEventSubscription(userId, {
      type: 'category',
      value: category
    });
  }

  // 订阅实体
  async subscribeToEntity(userId: string, entity: string): Promise<IUser> {
    return await this.addEventSubscription(userId, {
      type: 'entity',
      value: entity
    });
  }

  // 获取用户订阅的事件
  async getUserSubscribedEvents(userId: string, limit: number = 20): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const activeSubscriptions = user.subscriptions.filter(sub => sub.isActive);
    
    if (activeSubscriptions.length === 0) {
      return [];
    }

    // 构建查询条件
    const query: any = { $or: [] };

    activeSubscriptions.forEach(subscription => {
      switch (subscription.type) {
        case 'event':
          query.$or.push({ _id: subscription.value });
          break;
        case 'keyword':
          query.$or.push({ keywords: { $in: [subscription.value] } });
          break;
        case 'category':
          query.$or.push({ category: subscription.value });
          break;
        case 'entity':
          query.$or.push({
            $or: [
              { title: { $regex: subscription.value, $options: 'i' } },
              { description: { $regex: subscription.value, $options: 'i' } },
              { keywords: { $in: [subscription.value] } }
            ]
          });
          break;
      }
    });

    // 应用用户偏好过滤
    if (user.preferences.importance) {
      query.importance = { $gte: user.preferences.importance };
    }

    if (user.preferences.categories && user.preferences.categories.length > 0) {
      query.category = { $in: user.preferences.categories };
    }

    const events = await Event.find(query)
      .sort({ updatedAt: -1, importance: -1 })
      .limit(limit);

    return events;
  }

  // 获取个性化推荐事件
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 基于用户偏好和历史行为推荐
    const query: any = {};

    // 分类偏好
    if (user.preferences.categories && user.preferences.categories.length > 0) {
      query.category = { $in: user.preferences.categories };
    }

    // 重要度阈值
    if (user.preferences.importance) {
      query.importance = { $gte: user.preferences.importance };
    }

    // 关键词偏好
    if (user.preferences.keywords && user.preferences.keywords.length > 0) {
      query.keywords = { $in: user.preferences.keywords };
    }

    const events = await Event.find(query)
      .sort({ importance: -1, updatedAt: -1 })
      .limit(limit * 2); // 获取更多候选事件

    // 基于情感偏好过滤
    const filteredEvents = [];
    for (const event of events) {
      if (filteredEvents.length >= limit) break;

      const sentiment = this.sentimentService.analyzeSentiment(
        event.title + ' ' + event.description
      );

      if (user.preferences.sentiment.includes(sentiment.label)) {
        filteredEvents.push({
          ...event.toObject(),
          recommendationScore: this.calculateRecommendationScore(event, user),
          recommendationReason: this.generateRecommendationReason(event, user)
        });
      }
    }

    return filteredEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  // 计算推荐分数
  private calculateRecommendationScore(event: any, user: IUser): number {
    let score = event.importance * 10; // 基础分数

    // 分类匹配加分
    if (user.preferences.categories.includes(event.category)) {
      score += 20;
    }

    // 关键词匹配加分
    const keywordMatches = event.keywords.filter((keyword: string) =>
      user.preferences.keywords.includes(keyword)
    ).length;
    score += keywordMatches * 5;

    // 时间新鲜度加分
    const hoursSinceUpdate = (Date.now() - new Date(event.updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 24) score += 10;
    else if (hoursSinceUpdate < 72) score += 5;

    return score;
  }

  // 生成推荐理由
  private generateRecommendationReason(event: any, user: IUser): string {
    const reasons = [];

    if (user.preferences.categories.includes(event.category)) {
      reasons.push(`您关注${event.category}类事件`);
    }

    const keywordMatches = event.keywords.filter((keyword: string) =>
      user.preferences.keywords.includes(keyword)
    );
    if (keywordMatches.length > 0) {
      reasons.push(`包含您关注的关键词：${keywordMatches.join('、')}`);
    }

    if (event.importance >= 8) {
      reasons.push('高重要度事件');
    }

    return reasons.length > 0 ? reasons.join('；') : '基于您的偏好推荐';
  }

  // 查找需要通知的用户
  async findUsersToNotify(event: any): Promise<IUser[]> {
    const query = {
      $or: [
        // 订阅了特定事件的用户
        { 'subscriptions.type': 'event', 'subscriptions.value': event._id, 'subscriptions.isActive': true },
        // 订阅了相关关键词的用户
        { 'subscriptions.type': 'keyword', 'subscriptions.value': { $in: event.keywords }, 'subscriptions.isActive': true },
        // 订阅了相关分类的用户
        { 'subscriptions.type': 'category', 'subscriptions.value': event.category, 'subscriptions.isActive': true },
        // 偏好设置匹配的用户
        { 
          'preferences.categories': { $in: [event.category] },
          'preferences.importance': { $lte: event.importance }
        }
      ]
    };

    return await User.find(query);
  }

  // 更新用户偏好
  async updateUserPreferences(userId: string, preferences: Partial<IUser['preferences']>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    Object.assign(user.preferences, preferences);
    user.lastActiveAt = new Date();

    return await user.save();
  }

  // 更新通知设置
  async updateNotificationSettings(userId: string, settings: Partial<IUser['notifications']>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    Object.assign(user.notifications, settings);
    
    return await user.save();
  }

  // 获取用户统计信息
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const activeSubscriptions = user.subscriptions.filter(sub => sub.isActive);
    const subscriptionsByType = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.type] = (acc[sub.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subscribedEvents = await this.getUserSubscribedEvents(userId, 100);
    const recommendations = await this.getPersonalizedRecommendations(userId, 20);

    return {
      totalSubscriptions: activeSubscriptions.length,
      subscriptionsByType,
      subscribedEventsCount: subscribedEvents.length,
      recommendationsCount: recommendations.length,
      lastActiveAt: user.lastActiveAt,
      memberSince: user.createdAt,
      preferences: user.preferences,
      notificationSettings: user.notifications
    };
  }

  // 清理过期订阅
  async cleanupExpiredSubscriptions(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await User.updateMany(
      { 'subscriptions.lastNotified': { $lt: thirtyDaysAgo } },
      { $pull: { subscriptions: { lastNotified: { $lt: thirtyDaysAgo }, isActive: false } } }
    );
  }

  // 批量更新通知时间
  async updateLastNotifiedTime(userIds: string[], eventId: string): Promise<void> {
    await User.updateMany(
      { 
        _id: { $in: userIds },
        'subscriptions.eventId': eventId
      },
      { 
        $set: { 'subscriptions.$.lastNotified': new Date() }
      }
    );
  }
}

// 类型定义
export interface UserStats {
  totalSubscriptions: number;
  subscriptionsByType: Record<string, number>;
  subscribedEventsCount: number;
  recommendationsCount: number;
  lastActiveAt: Date;
  memberSince: Date;
  preferences: any;
  notificationSettings: any;
}