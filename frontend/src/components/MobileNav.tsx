import React from 'react';
import { Menu, X, Bell, Search, TrendingUp, Clock, BarChart3 } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* 移动端导航栏 */}
      <nav className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center space-x-2">
                <Clock className="h-6 w-6 text-primary-600" />
                <h1 className="text-lg font-bold text-gray-900">热点记忆</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 侧边抽屉菜单 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onToggle}
          />
          
          {/* 侧边菜单 */}
          <div className="relative flex flex-col w-80 max-w-xs bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
              <button onClick={onToggle} className="p-2 rounded-md text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-2">
              <MobileMenuItem 
                icon={<TrendingUp className="h-5 w-5" />}
                label="热点事件"
                href="/"
                active={true}
              />
              <MobileMenuItem 
                icon={<BarChart3 className="h-5 w-5" />}
                label="数据分析"
                href="/analytics"
              />
              <MobileMenuItem 
                icon={<Search className="h-5 w-5" />}
                label="搜索"
                href="/search"
              />
              <MobileMenuItem 
                icon={<Bell className="h-5 w-5" />}
                label="我的订阅"
                href="/subscriptions"
              />
            </nav>
            
            <div className="border-t px-4 py-3">
              <div className="text-sm text-gray-500">
                最后更新: {new Date().toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface MobileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const MobileMenuItem: React.FC<MobileMenuItemProps> = ({ icon, label, href, active }) => (
  <a
    href={href}
    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </a>
);

export default MobileNav;