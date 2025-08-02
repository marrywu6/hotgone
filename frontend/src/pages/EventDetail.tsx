import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Event, Timeline } from '../types';
import { Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTimeline, setExpandedTimeline] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/events/${eventId}`);
      setEvent(response.data);
    } catch (err) {
      console.error('Failed to fetch event:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimelineExpand = (timelineId: string) => {
    setExpandedTimeline(prev =>
      prev.includes(timelineId)
        ? prev.filter(id => id !== timelineId)
        : [...prev, timelineId]
    );
  };

  if (loading) {
    return <div className="flex justify-center py-12">加载中...</div>;
  }

  if (!event) {
    return <div className="text-center py-12">事件不存在</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
        <p className="text-gray-600 mb-6">{event.description}</p>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
            {event.category}
          </span>
          {event.keywords.map((keyword, index) => (
            <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
              {keyword}
            </span>
          ))}
        </div>

        {event.sources.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">相关来源</h3>
            <div className="space-y-2">
              {event.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary-600 hover:text-primary-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {source}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">事件时间线</h2>
        
        <div className="space-y-6">
          {event.timeline.map((item, index) => (
            <div key={item._id} className="relative">
              {index !== event.timeline.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(item.date), 'yyyy-MM-dd')}
                      </span>
                    </div>
                    
                    <div className="text-gray-600">
                      {expandedTimeline.includes(item._id) ? (
                        <div>
                          <p className="mb-3">{item.content}</p>
                          {item.source && (
                            <a
                              href={item.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              查看来源
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="line-clamp-2">{item.content}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleTimelineExpand(item._id)}
                      className="mt-2 text-primary-600 hover:text-primary-700 text-sm flex items-center"
                    >
                      {expandedTimeline.includes(item._id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          展开
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;