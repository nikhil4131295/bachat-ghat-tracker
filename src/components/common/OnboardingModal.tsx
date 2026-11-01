import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Zap, WifiOff, FileSpreadsheet, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';

interface OnboardingModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ forceOpen = false, onClose }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const seen = localStorage.getItem('bg_tutorial_seen');
    if (!seen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const slides = [
    {
      icon: <Building2 className="w-10 h-10 text-teal-dark" />,
      bg: 'bg-teal-surface border-teal-light/30',
      title: 'महिला बचत गटांसाठी सोपे डिजिटल खातेवही',
      subtitle: 'जय भवानी महिला बचत गट ट्रॅकर',
      desc: 'आता जुन्या कागदी वह्या आणि पेनची गरज नाही. बचत, कर्ज, व्याज आणि खर्चाचा संपूर्ण हिशोब तुमच्या मोबाईलवर सोप्या भाषेत ठेवा.',
    },
    {
      icon: <Zap className="w-10 h-10 text-coral-primary" />,
      bg: 'bg-coral-surface border-coral-light/30',
      title: '२० सेकंदात एक-टॅप नोंद (One-Tap)',
      subtitle: 'जलद आणि बिनचूक हिशोब',
      desc: 'मासिक बैठक सुरू असताना अवघ्या २० सेकंदात सदस्यांची बचत किंवा कर्ज हप्ता नोंदवा. कमी होत जाणारे व्याज (Reducing Balance) आपोआप मोजले जाते.',
    },
    {
      icon: <WifiOff className="w-10 h-10 text-emerald-700" />,
      bg: 'bg-emerald-50 border-emerald-200',
      title: '१००% ऑफलाइन काम • आपोआप बॅकअप',
      subtitle: 'नेटवर्क नसतानाही अखंड काम',
      desc: 'गावात इंटरनेट नसले तरी ॲप विनाअडथळा चालते. फोनला इंटरनेट मिळताच सर्व नोंदी आपोआप खाजगी क्लाउडवर सुरक्षित साठवल्या जातात.',
    },
    {
      icon: <FileSpreadsheet className="w-10 h-10 text-blue-700" />,
      bg: 'bg-sky-50 border-sky-200',
      title: 'व्हॉट्सॲप पासबुक आणि एक्सेल अहवाल',
      subtitle: 'पारदर्शक आणि अधिकृत हिशोब',
      desc: 'प्रत्येक सदस्याला त्यांच्या मोबाईलवर डिजिटल पासबुक लिंक पाठवा, आणि ग्रामपंचायत किंवा बँकेसाठी एका क्लिकवर संपूर्ण एक्सेल अहवाल डाउनलोड करा.',
    },
  ];

  const handleFinish = () => {
    localStorage.setItem('bg_tutorial_seen', 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-5 text-center relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={handleFinish}
          className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Illustrated Icon Badge */}
        <div className="flex justify-center pt-2">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-sm ${slide.bg}`}>
            {slide.icon}
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1.5 px-2">
          <p className="text-[11px] font-bold text-coral-primary uppercase tracking-wider">
            {slide.subtitle}
          </p>
          <h3 className="font-heading font-extrabold text-lg text-foreground leading-snug">
            {slide.title}
          </h3>
          <p className="text-xs text-muted leading-relaxed pt-1">
            {slide.desc}
          </p>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-teal-primary' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pt-2">
          {currentSlide > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>मागे</span>
            </button>
          ) : (
            <div className="w-0" />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 min-h-touch py-3 rounded-2xl bg-teal-primary hover:bg-teal-hover active:scale-98 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <span>{currentSlide === slides.length - 1 ? 'सुरू करा (Start)' : 'पुढे जा'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
