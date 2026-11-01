import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe, X } from 'lucide-react';

interface LanguagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  {
    code: 'mr',
    name: 'मराठी',
    subtext: 'महाराष्ट्र महिला बचत गट',
    flag: '🚩',
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    subtext: 'महिला स्वयं सहायता समूह',
    flag: '🇮🇳',
  },
  {
    code: 'en',
    name: 'English',
    subtext: 'Self-Help Group Tracker',
    flag: '🌐',
  },
];

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({ isOpen, onClose }) => {
  const { i18n, t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-lg">
            <Globe className="w-5 h-5 text-teal-dark" />
            <span>{t('selectLanguage')}</span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {LANGUAGES.map(lang => {
            const isSelected = i18n.language.startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`w-full min-h-[64px] p-4 rounded-2xl flex items-center justify-between text-left transition-all border-2 ${
                  isSelected
                    ? 'border-teal-primary bg-teal-surface shadow-sm'
                    : 'border-gray-200 hover:border-teal-light bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-heading font-bold text-lg text-foreground">
                      {lang.name}
                    </div>
                    <div className="text-xs text-muted font-medium">
                      {lang.subtext}
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-8 h-8 rounded-full bg-teal-primary text-white flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-gray-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
