import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Key,
  Copy,
  Check,
  Globe,
  Percent,
  IndianRupee,
  Calendar,
  LogOut,
  RotateCcw,
  Sparkles,
  Building2,
  Cloud,
  CloudUpload,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  Smartphone,
  Share2,
  MoreVertical,
  X,
  Download,
  ShieldCheck,
  HelpCircle,
  Pencil,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LanguagePickerModal } from '../components/common/LanguagePickerModal';
import { OnboardingModal } from '../components/common/OnboardingModal';
import { formatINR } from '../lib/calculations';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentGroup, updateGroupDetails, isDemo, exitDemoMode, startDemoMode, syncState, handleManualSync, setUserRole } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editVillage, setEditVillage] = useState(currentGroup?.village || '');
  const [editPanchayat, setEditPanchayat] = useState(currentGroup?.panchayat || '');
  const [editGroupName, setEditGroupName] = useState(currentGroup?.name || '');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const handleCopyCode = () => {
    if (currentGroup?.group_code) {
      navigator.clipboard.writeText(currentGroup.group_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveGroupInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVillage.trim()) return;
    setIsSavingGroup(true);
    try {
      await updateGroupDetails({
        village: editVillage.trim(),
        panchayat: editPanchayat.trim(),
        name: editGroupName.trim() || currentGroup?.name,
      });
      setIsEditingGroup(false);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const onTriggerSync = async () => {
    setSyncFeedback(null);
    const res = await handleManualSync();
    if (res.success) {
      setSyncFeedback(t('syncSuccess'));
      setTimeout(() => setSyncFeedback(null), 3000);
    } else {
      setSyncFeedback(res.error || 'Sync failed');
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-5 pb-24 px-4 max-w-md mx-auto pt-2">
      <h2 className="font-heading font-extrabold text-xl text-teal-dark">
        {t('navSettings')}
      </h2>

      {/* 1. Group Code Card (Large 6-character code) */}
      {currentGroup && (
        <div className="p-5 rounded-3xl bg-teal-surface border-2 border-teal-primary/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-dark uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-teal-primary" />
              <span>{t('groupCodeTitle')}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-white border border-teal-light/30 text-xs font-bold text-teal-dark flex items-center gap-1 shadow-2xs hover:bg-teal-50"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? t('copied') : t('copyLink')}</span>
            </button>
          </div>

          <div className="font-heading font-black text-3xl text-teal-dark tracking-widest text-center py-1">
            {currentGroup.group_code}
          </div>

          <p className="text-xs text-muted font-medium text-center">
            {t('groupCodeNotice')}
          </p>
        </div>
      )}

      {/* 2. Group Details Card (Village & Panchayat) */}
      {currentGroup && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-primary" />
              <span>{i18n.language.startsWith('mr') ? 'गटाची माहिती' : i18n.language.startsWith('hi') ? 'समूह की जानकारी' : 'Group Information'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditVillage(currentGroup.village);
                setEditPanchayat(currentGroup.panchayat);
                setEditGroupName(currentGroup.name);
                setIsEditingGroup(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-surface text-teal-dark hover:bg-teal-100 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{i18n.language.startsWith('mr') ? 'बदल करा' : i18n.language.startsWith('hi') ? 'बदलें' : 'Edit'}</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-muted font-medium text-[11px] block">{t('groupName')}</span>
              <span className="font-bold text-foreground font-heading text-sm block mt-0.5">
                {currentGroup.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium text-[11px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-primary" />
                  <span>{t('village')}</span>
                </span>
                <span className="font-bold text-foreground font-heading text-xs block mt-1">
                  {currentGroup.village}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium text-[11px] block">{t('panchayat')}</span>
                <span className="font-bold text-foreground font-heading text-xs block mt-1 truncate" title={currentGroup.panchayat}>
                  {currentGroup.panchayat}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Group Rules Overview */}
      {currentGroup && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground">
            {t('groupRulesTitle')}
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-muted font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-teal-primary" />
                <span>{t('monthlySavingRule')}</span>
              </span>
              <span className="font-bold text-foreground font-heading">
                {formatINR(currentGroup.monthly_saving_amount)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-muted font-medium flex items-center gap-2">
                <Percent className="w-4 h-4 text-teal-primary" />
                <span>{t('monthlyInterestRule')}</span>
              </span>
              <span className="font-bold text-foreground font-heading">
                {currentGroup.monthly_interest_rate}% {t('perMonth')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <span className="text-muted font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-primary" />
                <span>{t('meetingDayRule')}</span>
              </span>
              <span className="font-bold text-foreground font-heading">
                {t('meetingDayVal', { day: currentGroup.meeting_day })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Language Setting */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">
              {t('selectLanguage')}
            </h3>
            <p className="text-xs text-muted">
              {i18n.language.startsWith('mr') ? 'मराठी' : i18n.language.startsWith('hi') ? 'हिन्दी' : 'English'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLangModalOpen(true)}
          className="min-h-touch px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-foreground"
        >
          {t('changeLangBtn')}
        </button>
      </div>

      {/* 4. Data & Cloud Sync */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5 text-teal-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-sm text-foreground">
              {t('dataAndSync')}
            </h3>
            <p className="text-xs text-muted leading-relaxed mt-0.5">
              {t('dataAndSyncDesc')}
            </p>
          </div>
        </div>

        {/* Sync Status Grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-muted font-medium flex items-center gap-2">
              {syncState.status === 'offline' ? (
                <WifiOff className="w-4 h-4 text-orange-600" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-600" />
              )}
              <span>{t('connectionStatus')}</span>
            </span>
            <span
              className={`font-bold font-heading px-2 py-0.5 rounded-full text-xs ${
                syncState.status === 'offline'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {syncState.status === 'offline' ? t('offline') : t('online')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-muted font-medium flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-amber-600" />
              <span>{t('pendingQueue')}</span>
            </span>
            <span
              className={`font-bold font-heading px-2 py-0.5 rounded-full text-xs ${
                syncState.pendingCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {syncState.pendingCount > 0
                ? t('syncPendingCount', { count: syncState.pendingCount })
                : t('allSaved')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-muted font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-primary" />
              <span>{t('lastSynced')}</span>
            </span>
            <span className="font-bold text-foreground text-[11px]">
              {syncState.lastSyncTime
                ? new Date(syncState.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : t('neverSynced')}
            </span>
          </div>
        </div>

        {/* Feedback message */}
        {syncFeedback && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
            {syncFeedback}
          </div>
        )}

        {/* Manual Sync Button */}
        <button
          type="button"
          onClick={onTriggerSync}
          disabled={syncState.status === 'offline' || syncState.status === 'syncing'}
          className="w-full min-h-touch py-3 rounded-2xl bg-teal-primary hover:bg-teal-hover active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          {syncState.status === 'syncing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('syncing')}</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" />
              <span>{t('syncNow')}</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Install on Phone / App Info Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coral-surface text-coral-primary flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-coral-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">
              {t('installBannerTitle')}
            </h3>
            <p className="text-xs text-muted">
              {t('installBannerDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInstallModal(true)}
          className="min-h-touch px-4 py-2 rounded-2xl bg-coral-primary hover:bg-coral-hover text-white text-xs font-bold shadow-xs active:scale-95 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('installApp')}</span>
        </button>
      </div>

      {/* 4. Demo Controls */}
      {isDemo && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-heading font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t('usingDemoTitle')}</span>
          </div>
          <p className="text-xs text-amber-800">
            {t('usingDemoDesc')}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={startDemoMode}
              className="flex-1 min-h-touch py-2.5 rounded-2xl bg-white border border-amber-300 text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('resetDemoBtn')}</span>
            </button>

            <button
              type="button"
              onClick={exitDemoMode}
              className="flex-1 min-h-touch py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{t('exitDemoBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. About App & Logout */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">
              {t('aboutAppTitle')}
            </h3>
            <p className="text-xs text-muted">
              {t('aboutAppDesc')}
            </p>
          </div>
        </div>

        <div className="pt-1 flex flex-col gap-2">
          {/* Re-open Tutorial */}
          <button
            type="button"
            onClick={() => setShowTutorialModal(true)}
            className="w-full min-h-touch py-3 rounded-2xl bg-teal-surface hover:bg-teal-100 text-teal-dark font-heading font-bold text-xs flex items-center justify-center gap-2 border border-teal-light/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-teal-primary" />
            <span>ॲप मार्गदर्शक पहा (Tutorial Walkthrough)</span>
          </button>

          {/* Switch to Officer Portal */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('bg_user_role', 'officer');
              setUserRole('officer');
            }}
            className="w-full min-h-touch py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-foreground font-heading font-bold text-xs flex items-center justify-center gap-2 border border-gray-200 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-teal-primary" />
            <span>ग्रामपंचायत अधिकारी पोर्टल उघडा (Officer Portal)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={exitDemoMode}
          className="w-full min-h-touch py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-heading font-bold text-xs flex items-center justify-center gap-2 border border-red-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>

      <LanguagePickerModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <Smartphone className="w-5 h-5 text-coral-primary" />
                <span>{t('howToInstall')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground font-medium leading-relaxed">
              {/* Android Card */}
              <div className="p-4 rounded-2xl border space-y-2 bg-teal-50/70 border-teal-200">
                <div className="flex items-center gap-2 font-heading font-bold text-teal-dark">
                  <MoreVertical className="w-4 h-4 text-teal-primary" />
                  <span>Android (Chrome / Google)</span>
                </div>
                <p className="text-gray-700 leading-normal">
                  {t('androidInstructions')}
                </p>
              </div>

              {/* iOS Card */}
              <div className="p-4 rounded-2xl border space-y-2 bg-gray-50 border-gray-100">
                <div className="flex items-center gap-2 font-heading font-bold text-teal-dark">
                  <Share2 className="w-4 h-4 text-teal-primary" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <p className="text-gray-700 leading-normal">
                  {t('iosInstructions')}
                </p>
              </div>

              {/* Offline highlight */}
              <div className="p-3 rounded-2xl bg-pastel-mint/80 border border-emerald-200 text-teal-dark font-bold text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>⚡ एकदा इन्स्टॉल झाल्यावर इंटरनेट नसतानाही अखंड काम करते!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full min-h-touch py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-sm"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Walkthrough Modal */}
      {showTutorialModal && (
        <OnboardingModal
          forceOpen={true}
          onClose={() => setShowTutorialModal(false)}
        />
      )}

      {/* Edit Group Info Modal */}
      {isEditingGroup && currentGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <Building2 className="w-5 h-5 text-teal-primary" />
                <span>{i18n.language.startsWith('mr') ? 'गाव व गट माहिती बदला' : 'Edit Group Details'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroupInfo} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('groupName')}
                </label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={e => setEditGroupName(e.target.value)}
                  className="w-full min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('village')} *
                </label>
                <input
                  type="text"
                  required
                  value={editVillage}
                  onChange={e => setEditVillage(e.target.value)}
                  placeholder="उदा. येरला (Yerla)"
                  className="w-full min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('panchayat')} *
                </label>
                <input
                  type="text"
                  required
                  value={editPanchayat}
                  onChange={e => setEditPanchayat(e.target.value)}
                  placeholder="उदा. येरला ग्रामपंचायत"
                  className="w-full min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingGroup(false)}
                  className="flex-1 min-h-touch py-2.5 rounded-2xl border border-gray-200 font-heading font-bold text-sm text-muted"
                >
                  {t('prevStep') || 'रद्द करा'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingGroup || !editVillage.trim()}
                  className="flex-1 min-h-touch py-2.5 rounded-2xl bg-teal-primary hover:bg-teal-dark text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{t('save') || 'जतन करा'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
