import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeline {
  date: Date;
  title: string;
  content: string;
  source?: string;
  type: 'incident' | 'development' | 'resolution';
}

export interface IEvent extends Document {
  title: string;
  description: string;
  category: string;
  status: 'active' | 'resolved' | 'ongoing';
  timeline: ITimeline[];
  sources: string[];
  keywords: string[];
  importance: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineSchema = new Schema<ITimeline>({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  source: { type: String },
  type: { 
    type: String, 
    enum: ['incident', 'development', 'resolution'], 
    required: true 
  }
});

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'ongoing'], 
    default: 'active' 
  },
  timeline: [TimelineSchema],
  sources: [{ type: String }],
  keywords: [{ type: String }],
  importance: { type: Number, default: 1, min: 1, max: 10 }
}, {
  timestamps: true
});

// 添加文本搜索索引
EventSchema.index({
  title: 'text',
  description: 'text',
  keywords: 'text'
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);