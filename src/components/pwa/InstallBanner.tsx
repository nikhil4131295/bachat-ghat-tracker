import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, X, HelpCircle, Share2, MoreVertical, PlusSquare, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallBanner: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running as installed PWA (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user already dismissed banner this session
    const dismissed = localStorage.getItem('bg_pwa_dismissed') === 'true';
    if (!dismissed) {
      setIsDismissed(false);
    }

    // 3. Listen for Android Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsDismissed(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsDismissed(true);
    } else {
      // If native prompt isn't supported (iOS or desktop browser), show step-by-step modal
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bg_pwa_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <aside aria-label="Install App Banner" className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-xl border-2 border-teal-primary/30 flex items-center justify-between gap-3">
          {/* App Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-teal-surface border border-teal-light/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-teal-dark" />
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-extrabold text-xs text-teal-dark truncate">
                {t('installBannerTitle')}
              </h4>
              <p className="text-[11px] text-muted truncate">
                {t('installBannerDesc')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-2xl bg-coral-primary hover:bg-coral-hover text-white font-heading font-extrabold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('installApp')}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Step-by-Step Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <Smartphone className="w-5 h-5 text-coral-primary" />
                <span>{t('howToInstall')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground font-medium leading-relaxed">
              {/* Android Card */}
              <div className={`p-4 rounded-2xl border space-y-2 ${!isIOS ? 'bg-teal-50/70 border-teal-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 font-heading font-bold text-teal-dark">
                  <MoreVertical className="w-4 h-4 text-teal-primary" />
                  <span>Android (Chrome / Google)</span>
                </div>
                <p className="text-gray-700 leading-normal">
                  {t('androidInstructions')}
                </p>
              </div>

              {/* iOS Card */}
              <div className={`p-4 rounded-2xl border space-y-2 ${isIOS ? 'bg-teal-50/70 border-teal-200' : 'bg-gray-50 border-gray-100'}`}>
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
                <span>⚡ इंटरनेट नसतानाही थेट होमस्क्रीनवरून ॲप सुरू होईल!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="w-full min-h-touch py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-sm"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
