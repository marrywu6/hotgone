import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { ArrowLeft, Share, Bookmark, MoreVertical, Clock, ExternalLink, 
         TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';

interface MobileEventDetailProps {
  event: Event;
  onBack: () => void;
}

const MobileEventDetail: React.FC<MobileEventDetailProps> = ({ event, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'related' | 'sentiment'>('timeline');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const tabs = [
    { id: 'timeline', label: '时间线', icon: <Clock className="h-4 w-4" /> },
    { id: 'related', label: '相关事件', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'sentiment', label: '情感分析', icon: <ThumbsUp className="h-4 w-4" /> }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? 'text-yellow-500 fill-current' : 'text-gray-500'}`} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <Share className="h-5 w-5 text-gray-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* 事件头部信息 */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border overflow-hidden">
        {/* 重要性指示条 */}
        <div className={`h-1 ${event.importance >= 8 ? 'bg-red-500' : event.importance >= 6 ? 'bg-yellow-500' : 'bg-green-500'}`} />
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 leading-6 flex-1 pr-3">
              {event.title}
            </h1>
            <div className="flex items-center space-x-1">
              {event.status === 'active' && <AlertTriangle className="h-4 w-4 text-red-500" />}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                event.importance >= 8 ? 'bg-red-100 text-red-800' : 
                event.importance >= 6 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {event.importance}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {event.description}
          </p>
          
          {/* 标签云 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
              {event.category}
            </span>
            {event.keywords.map((keyword, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {keyword}
              </span>
            ))}
          </div>

          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <div className="flex items-center space-x-4">
              <span>{event.timeline.length} 个更新</span>
              <span>{event.sources.length} 个来源</span>
            </div>
            <span>{format(new Date(event.updatedAt), 'MM-dd HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="mx-4 mt-4 pb-6">
        {activeTab === 'timeline' && (
          <TimelineTab timeline={event.timeline} />
        )}
        {activeTab === 'related' && (
          <RelatedEventsTab eventId={event._id} />
        )}
        {activeTab === 'sentiment' && (
          <SentimentTab eventId={event._id} />
        )}
      </div>
    </div>
  );
};

// 时间线标签页
const TimelineTab: React.FC<{ timeline: any[] }> = ({ timeline }) => {
  return (
    <div className="space-y-4">
      {timeline.map((item) => (
        <div key={item._id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                <span className="text-xs text-gray-500">
                  {format(new Date(item.date), 'MM-dd HH:mm')}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {item.content}
              </p>
              
              {item.source && (
                <a
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary-600 text-xs hover:text-primary-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>查看来源</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 相关事件标签页
const RelatedEventsTab: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载相关事件
    setTimeout(() => {
      setRelatedEvents([
        { id: '1', title: '类似教育改革事件', similarity: 85 },
        { id: '2', title: '相关医疗政策调整', similarity: 72 },
        { id: '3', title: '同期社会关注话题', similarity: 68 }
      ]);
      setLoading(false);
    }, 1000);
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">分析相关事件中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relatedEvents.map((related) => (
        <div key={related.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 flex-1">{related.title}</h4>
            <span className="text-xs text-primary-600 font-medium">
              {related.similarity}% 相似
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-600 h-1 rounded-full" 
              style={{ width: `${related.similarity}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 情感分析标签页
const SentimentTab: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [sentiment, setSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载情感分析数据
    setTimeout(() => {
      setSentiment({
        overall: 'negative',
        score: -0.3,
        confidence: 0.75,
        keywords: ['争议', '质疑', '关注', '改革'],
        trend: 'declining'
      });
      setLoading(false);
    }, 1000);
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">分析情感趋势中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 整体情感 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">整体情感</h4>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {sentiment.overall === 'positive' ? (
              <ThumbsUp className="h-5 w-5 text-green-500" />
            ) : (
              <ThumbsDown className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              sentiment.overall === 'positive' ? 'text-green-700' : 'text-red-700'
            }`}>
              {sentiment.overall === 'positive' ? '积极' : '消极'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            置信度: {(sentiment.confidence * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              sentiment.overall === 'positive' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(sentiment.score) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 关键情感词 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">关键情感词</h4>
        <div className="flex flex-wrap gap-2">
          {sentiment.keywords.map((keyword: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileEventDetail;