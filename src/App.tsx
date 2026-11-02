import React, { useState, useEffect } from 'react';
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
import { PublicPassbookPage } from './pages/PublicPassbookPage';
import { OfficerDashboardPage } from './pages/OfficerDashboardPage';
import { InstallBanner } from './components/pwa/InstallBanner';
import { OnboardingModal } from './components/common/OnboardingModal';
import { Settings, Building2 } from 'lucide-react';

function getPassbookTokenFromUrl(): string | null {
  const path = window.location.pathname;
  // Vite injects BASE_URL at build time (e.g. '/bachat-ghat-tracker/' on GitHub Pages, '/' on Vercel)
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, ''); // strip trailing slash
  const passbookPrefix = `${base}/passbook/`;

  // Check pathname: /bachat-ghat-tracker/passbook/<token>  OR  /passbook/<token>
  if (path.startsWith(passbookPrefix)) {
    const token = path.slice(passbookPrefix.length);
    if (token.trim()) return token.trim();
  }
  if (path.startsWith('/passbook/')) {
    const parts = path.split('/passbook/');
    if (parts[1] && parts[1].trim()) return parts[1].trim();
  }

  const params = new URLSearchParams(window.location.search);
  const qToken = params.get('passbook');
  if (qToken) return qToken.trim();

  // GitHub Pages 404.html redirect: path is encoded as ?p=/passbook/<token>
  const pParam = params.get('p');
  if (pParam) {
    const decoded = decodeURIComponent(pParam);
    if (decoded.startsWith('/passbook/')) {
      const token = decoded.replace('/passbook/', '').split('?')[0].trim();
      if (token) {
        // Clean up the URL to look normal
        window.history.replaceState(null, '', `${base}/passbook/${token}`);
        return token;
      }
    }
  }

  const hash = window.location.hash;
  if (hash.includes('/passbook/')) {
    const hashParts = hash.split('/passbook/');
    if (hashParts[1] && hashParts[1].trim()) return hashParts[1].trim();
  }
  return null;
}

const MainApp: React.FC = () => {
  const { t } = useTranslation();
  const { currentGroup, userRole, activeTab, setActiveTab, isLoading } = useApp();
  const [isSettingUpGroup, setIsSettingUpGroup] = useState(false);
  const [passbookToken, setPassbookToken] = useState<string | null>(() => getPassbookTokenFromUrl());

  useEffect(() => {
    const handlePopState = () => {
      setPassbookToken(getPassbookTokenFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. If public passbook URL is open
  if (passbookToken) {
    return (
      <PublicPassbookPage
        token={passbookToken}
        onBackToApp={() => {
          const base = (import.meta.env.BASE_URL || '/');
          window.history.pushState({}, '', base);
          setPassbookToken(null);
        }}
      />
    );
  }

  // 2. Loading state
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

  // 3. Officer Portal if user is Gram Panchayat Officer
  if (userRole === 'officer') {
    return <OfficerDashboardPage />;
  }

  // 4. Group setup wizard
  if (isSettingUpGroup) {
    return <GroupSetupPage onComplete={() => setIsSettingUpGroup(false)} />;
  }

  // 5. Welcome screen if no group loaded
  if (!currentGroup) {
    return <WelcomePage onGroupSetupNeeded={() => setIsSettingUpGroup(true)} />;
  }

  // 6. Main Treasurer Dashboard & App
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

      <OnboardingModal />
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
