import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { WelcomePage } from './pages/WelcomePage';
import { GroupSetupPage } from './pages/GroupSetupPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { MembersPage } from './pages/MembersPage';
import { OneTapEntryPage } from './pages/OneTapEntryPage';
import { LoansPage } from './pages/LoansPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstallBanner } from './components/pwa/InstallBanner';
import { Settings, Building2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { currentGroup, activeTab, setActiveTab, isLoading } = useApp();
  const [isSettingUpGroup, setIsSettingUpGroup] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-surface border-2 border-teal-light/30 flex items-center justify-center animate-pulse shadow-sm">
          <Building2 className="w-8 h-8 text-teal-dark" />
        </div>
        <p className="mt-4 text-xs font-bold text-teal-dark tracking-wider uppercase">
          {t('appName')}...
        </p>
      </div>
    );
  }

  // 1. Group setup wizard
  if (isSettingUpGroup) {
    return <GroupSetupPage onComplete={() => setIsSettingUpGroup(false)} />;
  }

  // 2. Welcome screen if no group loaded
  if (!currentGroup) {
    return <WelcomePage onGroupSetupNeeded={() => setIsSettingUpGroup(true)} />;
  }

  // 3. Main Dashboard & App
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-teal-light selection:text-white">
      <Header />

      {/* Floating Settings toggle on top-right */}
      <div className="max-w-md mx-auto w-full px-4 pt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'settings' ? 'home' : 'settings')}
          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'settings'
              ? 'bg-teal-primary text-white shadow-xs'
              : 'text-muted hover:text-teal-dark bg-white border border-gray-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{activeTab === 'settings' ? t('navHome') : t('navSettings')}</span>
        </button>
      </div>

      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'home' && <DashboardOverview />}
        {activeTab === 'members' && <MembersPage />}
        {activeTab === 'add' && <OneTapEntryPage />}
        {activeTab === 'loans' && <LoansPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <InstallBanner />
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
