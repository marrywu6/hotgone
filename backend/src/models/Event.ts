import { PrismaClient, Event as PrismaEvent, Timeline as PrismaTimeline, EventStatus, TimelineType } from '@prisma/client';
import prisma from '../lib/database';

// 类型定义
export interface ITimeline {
  id?: string;
  date: Date;
  title: string;
  content: string;
  source?: string;
  type: TimelineType;
}

export interface IEvent {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: EventStatus;
  timeline?: ITimeline[];
  sources: string[];
  keywords: string[];
  importance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Event模型类
export class EventModel {
  // 创建新事件
  static async create(data: Omit<IEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    const { timeline, ...eventData } = data;
    
    return await prisma.event.create({
      data: {
        ...eventData,
        timeline: timeline ? {
          create: timeline.map(({ id, ...timelineItem }) => timelineItem)
        } : undefined
      },
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      }
    });
  }

  // 查找事件
  static async findById(id: string) {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      }
    });
  }

  // 查找多个事件
  static async findMany(options: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  } = {}) {
    return await prisma.event.findMany({
      ...options,
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        },
        ...options.include
      }
    });
  }

  // 更新事件
  static async update(id: string, data: Partial<IEvent>) {
    const { timeline, ...eventData } = data;
    
    return await prisma.event.update({
      where: { id },
      data: eventData,
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      }
    });
  }

  // 添加时间线项
  static async addTimeline(eventId: string, timelineData: Omit<ITimeline, 'id'>) {
    return await prisma.timeline.create({
      data: {
        ...timelineData,
        eventId
      }
    });
  }

  // 搜索事件
  static async search(query: string, options: {
    skip?: number;
    take?: number;
  } = {}) {
    return await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: [query] } },
          { category: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: [
        { importance: 'desc' },
        { updatedAt: 'desc' }
      ],
      ...options
    });
  }

  // 按日期范围查找
  static async findByDateRange(startDate: Date, endDate: Date, options: {
    skip?: number;
    take?: number;
    orderBy?: any;
  } = {}) {
    return await prisma.event.findMany({
      where: {
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: options.orderBy || [
        { importance: 'desc' },
        { updatedAt: 'desc' }
      ],
      skip: options.skip,
      take: options.take
    });
  }

  // 按分类统计
  static async getCategoryStats() {
    return await prisma.event.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });
  }

  // 获取热门事件
  static async getHotEvents(limit: number = 10) {
    return await prisma.event.findMany({
      orderBy: [
        { importance: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: limit,
      include: {
        timeline: {
          orderBy: { date: 'asc' }
        }
      }
    });
  }

  // 删除事件
  static async delete(id: string) {
    return await prisma.event.delete({
      where: { id }
    });
  }

  // 统计总数
  static async count(where?: any) {
    return await prisma.event.count({ where });
  }
}

export { EventStatus, TimelineType };
export default EventModel;