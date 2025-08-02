import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Event } from '../models/Event';

dotenv.config();

const sampleEvents = [
  {
    title: "协和医院4+4医学教育改革争议",
    description: "关于协和医学院4+4医学教育模式的讨论引发广泛关注，涉及医学教育质量和公平性问题。",
    category: "教育医疗",
    status: "ongoing",
    timeline: [
      {
        date: new Date('2024-01-15'),
        title: "事件曝光",
        content: "网络上开始讨论协和医学院的4+4教育模式存在的问题",
        type: "incident"
      },
      {
        date: new Date('2024-01-20'),
        title: "官方回应",
        content: "协和医学院发布声明回应相关质疑",
        type: "development"
      }
    ],
    sources: ["https://example.com/xiehe-news"],
    keywords: ["协和", "医学教育", "4+4", "教育改革"],
    importance: 8
  },
  {
    title: "成都地铁偷拍事件",
    description: "成都地铁内发生乘客偷拍他人的不当行为，引发公众对公共场所安全和隐私保护的关注。",
    category: "社会安全",
    status: "resolved",
    timeline: [
      {
        date: new Date('2024-02-10'),
        title: "事件发生",
        content: "乘客举报地铁内有人偷拍，相关视频在网络传播",
        type: "incident"
      },
      {
        date: new Date('2024-02-12'),
        title: "警方介入",
        content: "成都警方对此事展开调查，嫌疑人被抓获",
        type: "development"
      },
      {
        date: new Date('2024-02-15'),
        title: "案件结案",
        content: "嫌疑人被依法处理，地铁方面加强安全监管",
        type: "resolution"
      }
    ],
    sources: ["https://example.com/chengdu-metro"],
    keywords: ["成都", "地铁", "偷拍", "隐私保护"],
    importance: 7
  },
  {
    title: "武汉大学杨景媛事件",
    description: "武汉大学相关人员行为不当事件引发校园风气和师生关系的讨论。",
    category: "高等教育",
    status: "active",
    timeline: [
      {
        date: new Date('2024-03-01'),
        title: "事件曝光",
        content: "网络上传播相关不当行为的举报材料",
        type: "incident"
      },
      {
        date: new Date('2024-03-05'),
        title: "学校调查",
        content: "武汉大学成立调查组对此事进行核实",
        type: "development"
      }
    ],
    sources: ["https://example.com/whu-news"],
    keywords: ["武汉大学", "杨景媛", "师生关系", "校园风气"],
    importance: 6
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');
    
    // 清空现有数据
    await Event.deleteMany({});
    console.log('Cleared existing events');
    
    // 插入示例数据
    await Event.insertMany(sampleEvents);
    console.log('Sample events inserted successfully');
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Failed to seed database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();