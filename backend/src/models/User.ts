import mongoose, { Document, Schema } from 'mongoose';

// 用户模型
export interface IUser extends Document {
  email: string;
  username: string;
  avatar?: string;
  preferences: UserPreferences;
  subscriptions: EventSubscription[];
  notifications: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

// 用户偏好设置
export interface UserPreferences {
  categories: string[];      // 关注的分类
  keywords: string[];        // 关注的关键词
  importance: number;        // 最低重要度阈值
  sentiment: string[];       // 关注的情感类型
  regions: string[];         // 关注的地区
  sources: string[];         // 偏好的数据源
  language: string;          // 语言偏好
  timezone: string;          // 时区
}

// 事件订阅
export interface EventSubscription {
  eventId: string;
  type: 'event' | 'keyword' | 'category' | 'entity';
  value: string;             // 订阅的值（事件ID、关键词等）
  isActive: boolean;
  createdAt: Date;
  lastNotified?: Date;
}

// 通知设置
export interface NotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    eventTypes: string[];
  };
  push: {
    enabled: boolean;
    eventTypes: string[];
  };
  sms: {
    enabled: boolean;
    phone?: string;
    emergencyOnly: boolean;
  };
}

// 用户偏好设置Schema
const UserPreferencesSchema = new Schema<UserPreferences>({
  categories: [{ type: String }],
  keywords: [{ type: String }],
  importance: { type: Number, default: 5, min: 1, max: 10 },
  sentiment: [{ type: String, enum: ['positive', 'negative', 'neutral'] }],
  regions: [{ type: String }],
  sources: [{ type: String }],
  language: { type: String, default: 'zh-CN' },
  timezone: { type: String, default: 'Asia/Shanghai' }
});

// 事件订阅Schema
const EventSubscriptionSchema = new Schema<EventSubscription>({
  eventId: { type: String },
  type: { 
    type: String, 
    enum: ['event', 'keyword', 'category', 'entity'],
    required: true 
  },
  value: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastNotified: { type: Date }
});

// 通知设置Schema
const NotificationSettingsSchema = new Schema<NotificationSettings>({
  email: {
    enabled: { type: Boolean, default: true },
    frequency: { 
      type: String, 
      enum: ['immediate', 'hourly', 'daily', 'weekly'],
      default: 'daily'
    },
    eventTypes: [{ type: String }]
  },
  push: {
    enabled: { type: Boolean, default: true },
    eventTypes: [{ type: String }]
  },
  sms: {
    enabled: { type: Boolean, default: false },
    phone: { type: String },
    emergencyOnly: { type: Boolean, default: true }
  }
});

// 用户Schema
const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  username: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  avatar: { type: String },
  preferences: { 
    type: UserPreferencesSchema, 
    default: () => ({}) 
  },
  subscriptions: [EventSubscriptionSchema],
  notifications: { 
    type: NotificationSettingsSchema, 
    default: () => ({}) 
  },
  lastActiveAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 索引
UserSchema.index({ email: 1 });
UserSchema.index({ 'subscriptions.eventId': 1 });
UserSchema.index({ 'subscriptions.type': 1, 'subscriptions.value': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);