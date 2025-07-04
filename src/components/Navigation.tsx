import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Wrench, 
  BarChart3, 
  Menu, 
  X,
  Smile,
  Settings,
  LogOut,
  Users,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '#dashboard' },
  { id: 'inventory', label: 'Inventory', icon: Package, href: '#inventory' },
  { id: 'services', label: 'Services', icon: Wrench, href: '#services' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '#reports' },
  { id: 'branches', label: 'Branches', icon: Settings, href: '#branches', adminOnly: true },
  { id: 'users', label: 'Users', icon: Users, href: '#users', adminOnly: true },
  { id: 'bill-settings', label: 'Bill Settings', icon: FileText, href: '#bill-settings', adminOnly: true },
];

export function Navigation() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    // Dispatch custom event for tab changes
    window.dispatchEvent(new CustomEvent('tabChange', { detail: tabId }));
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      dispatch({ type: 'LOGOUT_USER' });
    }
  };

  const visibleNavItems = navItems.filter(item => 
    !item.adminOnly || state.currentUser.role === 'admin'
  );

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Smile className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smiley Mobiles</h1>
              <p className="text-sm text-gray-500">Service Center Management</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            
            <div className="ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-700">{state.currentUser.name}</span>
                  <div className="text-xs text-gray-500">
                    {state.currentUser.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex items-center justify-between px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{state.currentUser.name}</span>
                    <div className="text-xs text-gray-500">
                      {state.currentUser.role === 'admin' ? 'Administrator' : 'User'}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}