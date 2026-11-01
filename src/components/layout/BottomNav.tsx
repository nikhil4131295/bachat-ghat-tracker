import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Users, Plus, Landmark, FileSpreadsheet, Settings } from 'lucide-react';
import { useApp, NavigationTab } from '../../context/AppContext';

export const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-gray-200 px-2 py-1 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'home' ? 'text-teal-dark font-bold' : 'text-muted hover:text-foreground'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'home' ? 'bg-teal-surface text-teal-dark' : ''
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t('navHome')}</span>
        </button>

        {/* 2. Members */}
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'members' ? 'text-teal-dark font-bold' : 'text-muted hover:text-foreground'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'members' ? 'bg-teal-surface text-teal-dark' : ''
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t('navMembers')}</span>
        </button>

        {/* 3. BIG Center Coral "+" Action Button */}
        <div className="flex-1 flex justify-center -translate-y-3">
          <button
            onClick={() => setActiveTab('add')}
            className="w-14 h-14 rounded-full bg-coral-primary hover:bg-coral-hover text-white shadow-lg shadow-coral-primary/40 flex items-center justify-center transition-transform active:scale-90 border-4 border-white"
            aria-label={t('addEntry')}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Loans */}
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'loans' ? 'text-teal-dark font-bold' : 'text-muted hover:text-foreground'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'loans' ? 'bg-teal-surface text-teal-dark' : ''
            }`}
          >
            <Landmark className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t('navLoans')}</span>
        </button>

        {/* 5. Reports (or Settings toggle) */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'reports' ? 'text-teal-dark font-bold' : 'text-muted hover:text-foreground'
          }`}
        >
          <div
            className={`w-10 h-7 flex items-center justify-center rounded-xl transition-all ${
              activeTab === 'reports' ? 'bg-teal-surface text-teal-dark' : ''
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t('navReports')}</span>
        </button>
      </div>
    </nav>
  );
};
