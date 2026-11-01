import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Wifi, WifiOff, Sparkles, Building2, Loader2, CloudUpload, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguagePickerModal } from '../common/LanguagePickerModal';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentGroup, isDemo, syncState, handleManualSync } = useApp();
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const getLanguageLabel = () => {
    if (i18n.language.startsWith('mr')) return 'मराठी';
    if (i18n.language.startsWith('hi')) return 'हिन्दी';
    return 'English';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Logo & Group Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-surface border border-teal-light/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-teal-dark" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base text-teal-dark leading-tight truncate">
                {currentGroup ? currentGroup.name.split('(')[0].trim() : t('appName')}
              </h1>
              <p className="text-xs text-muted font-medium truncate">
                {currentGroup ? `${currentGroup.village} • ${currentGroup.panchayat}` : t('appSubtitle')}
              </p>
            </div>
          </div>

          {/* Right Actions: Demo/Sync Badge + Language Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isDemo ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('demoBadge')}</span>
              </span>
            ) : syncState.status === 'syncing' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>{t('syncing')}</span>
              </span>
            ) : syncState.status === 'offline' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                <WifiOff className="w-3 h-3 text-orange-600" />
                <span>
                  {syncState.pendingCount > 0
                    ? `${t('offline')} (${syncState.pendingCount})`
                    : t('offline')}
                </span>
              </span>
            ) : syncState.pendingCount > 0 ? (
              <button
                type="button"
                onClick={() => handleManualSync()}
                title="Click to sync now"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
              >
                <CloudUpload className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>{t('syncPendingCount', { count: syncState.pendingCount })}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{t('allSaved')}</span>
              </span>
            )}

            {/* Language Switcher Pill */}
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="min-h-touch px-3 py-1.5 rounded-2xl bg-gray-50 hover:bg-teal-surface border border-gray-200 text-xs font-bold text-teal-dark flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              aria-label="Change Language"
            >
              <Globe className="w-4 h-4 text-teal-primary" />
              <span>{getLanguageLabel()}</span>
            </button>
          </div>
        </div>
      </header>

      <LanguagePickerModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </>
  );
};
