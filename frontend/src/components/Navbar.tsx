import { Link } from 'react-router-dom';
import { Search, Clock, TrendingUp } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">热点记忆</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              <span>热点事件</span>
            </Link>
            <Link
              to="/search"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>搜索</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;