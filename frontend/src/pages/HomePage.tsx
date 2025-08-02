import { useState, useEffect } from 'react';
import { Event } from '../types';
import EventCard from '../components/EventCard';
import { Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { createApiUrl } from '../config/api';

const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(createApiUrl('/events'));
      setEvents(response.data.events || response.data);
    } catch (err) {
      setError('获取事件列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">热点社会事件</h1>
        <p className="text-gray-600">
          记录和追踪重要社会事件的发展历程
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无事件记录</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;