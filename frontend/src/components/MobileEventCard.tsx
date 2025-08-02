import React from 'react';
import { Event } from '../types';
import { Clock, AlertCircle, CheckCircle, MessageCircle, Share, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MobileEventCardProps {
  event: Event;
  onTap: (event: Event) => void;
}

const MobileEventCard: React.FC<MobileEventCardProps> = ({ event, onTap }) => {
  const getStatusIcon = () => {
    switch (event.status) {
      case 'active':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'ongoing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch (event.status) {
      case 'active':
        return '正在发生';
      case 'ongoing':
        return '持续关注';
      case 'resolved':
        return '已解决';
    }
  };

  const getImportanceColor = () => {
    if (event.importance >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (event.importance >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border mx-4 mb-4 overflow-hidden active:scale-95 transition-transform"
      onClick={() => onTap(event)}
    >
      {/* 重要性指示条 */}
      <div className={`h-1 ${event.importance >= 8 ? 'bg-red-500' : event.importance >= 6 ? 'bg-yellow-500' : 'bg-green-500'}`} />
      
      <div className="p-4">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-3">
            <h3 className="text-base font-semibold text-gray-900 leading-5 mb-2">
              {event.title}
            </h3>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
              <span className={`text-xs px-2 py-1 rounded-full border ${getImportanceColor()}`}>
                重要度 {event.importance}
              </span>
            </div>
          </div>
        </div>
        
        {/* 内容预览 */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
            {event.category}
          </span>
          {event.keywords.slice(0, 2).map((keyword, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {keyword}
            </span>
          ))}
          {event.keywords.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{event.keywords.length - 2}
            </span>
          )}
        </div>
        
        {/* 底部信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{event.timeline.length}</span>
            </div>
            <span className="text-xs">
              {formatDistanceToNow(new Date(event.updatedAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <Bookmark className="h-4 w-4 text-gray-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <Share className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileEventCard;