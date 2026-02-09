import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { RepositoryList } from './RepositoryList';
import { RepositoryDetail } from './RepositoryDetail';
import { HistoryPage } from './HistoryPage';
import { SettingsPage } from './SettingsPage';
import { Repository } from '../types';

export function Dashboard() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [currentView, setCurrentView] = useState<'repositories' | 'history' | 'settings'>('repositories');

  const renderContent = () => {
    if (selectedRepo) {
      return <RepositoryDetail repository={selectedRepo} />;
    }

    switch (currentView) {
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <RepositoryList onSelectRepo={setSelectedRepo} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa]">
      <Sidebar 
        onBack={selectedRepo ? () => setSelectedRepo(null) : undefined} 
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedRepo(null);
        }}
      />
      
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
