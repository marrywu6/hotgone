import { useState } from 'react';
import { Search } from 'lucide-react';
import { Event } from '../types';
import EventCard from '../components/EventCard';
import axios from 'axios';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/events/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
      setSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">搜索事件</h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索事件关键词..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
        </form>
      </div>

      {searched && (
        <div>
          <p className="text-gray-600 mb-6">
            找到 {results.length} 个相关事件
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">未找到相关事件</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;