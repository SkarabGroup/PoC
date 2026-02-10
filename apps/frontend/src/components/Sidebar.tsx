import { Shield, FolderGit2, History, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  onBack?: () => void;
  currentView: 'repositories' | 'history' | 'settings';
  onNavigate: (view: 'repositories' | 'history' | 'settings') => void;
}

export function Sidebar({ onBack, currentView, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const getButtonClass = (view: 'repositories' | 'history' | 'settings') => {
    const isActive = currentView === view;
    return `w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
      isActive 
        ? 'text-[#2e3338] bg-[#f5f5f5]' 
        : 'text-[#73787e] hover:bg-[#f5f5f5]'
    }`;
  };

  return (
    <aside className="w-60 bg-white border-r border-[#e5e5e5] flex flex-col">
      <div className="p-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2e3338] rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#2e3338]">Code Guardian</span>
        </div>
      </div>

      <nav className="flex-1 p-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#73787e] hover:bg-[#f5f5f5] rounded-lg transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Indietro</span>
          </button>
        )}
        
        <button 
          onClick={() => onNavigate('repositories')}
          className={getButtonClass('repositories')}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Repository</span>
        </button>
        
        <button 
          onClick={() => onNavigate('history')}
          className={getButtonClass('history')}
        >
          <History className="w-4 h-4" />
          <span>Storico</span>
        </button>
        
        <button 
          onClick={() => onNavigate('settings')}
          className={getButtonClass('settings')}
        >
          <Settings className="w-4 h-4" />
          <span>Impostazioni</span>
        </button>
      </nav>

      <div className="p-4 border-t border-[#e5e5e5]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
            <span className="text-[#2e3338]">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#2e3338] truncate">{user?.username || 'Utente'}</p>
            <p className="text-[#73787e] text-xs truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-[#73787e] hover:bg-[#f5f5f5] hover:text-red-600 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
