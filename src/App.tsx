import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InventoryManagement } from './components/InventoryManagement';
import { ServiceManagement } from './components/ServiceManagement';
import { Reports } from './components/Reports';
import { BranchManagement } from './components/BranchManagement';
import { UserManagement } from './components/UserManagement';
import { BillSettings } from './components/BillSettings';

type TabType = 'dashboard' | 'inventory' | 'services' | 'reports' | 'branches' | 'users' | 'bill-settings';

function AppContent() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    const handleTabChange = (event: CustomEvent<string>) => {
      setActiveTab(event.detail as TabType);
    };

    window.addEventListener('tabChange', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);

  if (!state.currentUser.isAuthenticated) {
    return <Login />;
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'inventory': return 'Inventory Management';
      case 'services': return 'Service Management';
      case 'reports': return 'Reports & Analytics';
      case 'branches': return 'Branch Management';
      case 'users': return 'User Management';
      case 'bill-settings': return 'Bill Settings';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventoryManagement />;
      case 'services': return <ServiceManagement />;
      case 'reports': return <Reports />;
      case 'branches': return <BranchManagement />;
      case 'users': return state.currentUser.role === 'admin' ? <UserManagement /> : <Dashboard />;
      case 'bill-settings': return state.currentUser.role === 'admin' ? <BillSettings /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout title={getPageTitle()}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;