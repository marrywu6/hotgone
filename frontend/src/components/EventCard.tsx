import { Link } from 'react-router-dom';
import { Event } from '../types';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
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

  return (
    <Link to={`/event/${event._id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {event.title}
          </h3>
          <div className="flex items-center space-x-1 ml-4">
            {getStatusIcon()}
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
              {event.category}
            </span>
            {event.keywords.slice(0, 2).map((keyword, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
          
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(event.updatedAt), { 
              addSuffix: true
            })}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;