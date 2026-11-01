import React from 'react';
import { Delete, ArrowRight } from 'lucide-react';

interface NumberPadProps {
  value: number;
  onChange: (newValue: number) => void;
  quickChips?: number[];
  onSubmit?: () => void;
  submitLabel?: string;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  value,
  onChange,
  quickChips = [100, 200, 500, 1000],
  onSubmit,
  submitLabel = 'पुढे जा',
}) => {
  const handleDigit = (digit: string) => {
    const currentStr = String(value || 0);
    let newStr: string;
    if (currentStr === '0') {
      newStr = digit;
    } else {
      // limit to 6 digits (up to ₹9,99,999)
      if (currentStr.length >= 6) return;
      newStr = currentStr + digit;
    }
    onChange(Number(newStr));
  };

  const handleBackspace = () => {
    const currentStr = String(value || 0);
    if (currentStr.length <= 1) {
      onChange(0);
    } else {
      onChange(Number(currentStr.slice(0, -1)));
    }
  };

  const handleClear = () => {
    onChange(0);
  };

  const handleChipClick = (amount: number) => {
    onChange(amount);
  };

  return (
    <div className="w-full space-y-3">
      {/* Quick Chips */}
      {quickChips.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {quickChips.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className={`py-2 px-1 rounded-xl text-xs font-heading font-extrabold transition-all border ${
                value === chip
                  ? 'bg-teal-primary text-white border-teal-primary shadow-xs'
                  : 'bg-white hover:bg-gray-50 text-foreground border-gray-200'
              }`}
            >
              ₹{chip}
            </button>
          ))}
        </div>
      )}

      {/* Large Digit Grid */}
      <div className="grid grid-cols-3 gap-2 bg-gray-50/70 p-2.5 rounded-3xl border border-gray-200/80">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="min-h-[58px] rounded-2xl bg-white hover:bg-teal-surface active:bg-teal-primary active:text-white border border-gray-200 text-xl font-heading font-extrabold text-foreground shadow-2xs flex items-center justify-center transition-all select-none"
          >
            {d}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="min-h-[58px] rounded-2xl bg-white hover:bg-red-50 text-red-600 border border-gray-200 text-xs font-heading font-bold shadow-2xs flex items-center justify-center transition-all active:scale-95"
        >
          C
        </button>

        {/* 0 Button */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="min-h-[58px] rounded-2xl bg-white hover:bg-teal-surface active:bg-teal-primary active:text-white border border-gray-200 text-xl font-heading font-extrabold text-foreground shadow-2xs flex items-center justify-center transition-all select-none"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          className="min-h-[58px] rounded-2xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs flex items-center justify-center transition-all active:scale-95"
          aria-label="Backspace"
        >
          <Delete className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {onSubmit && (
        <button
          type="button"
          disabled={value <= 0}
          onClick={onSubmit}
          className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span>{submitLabel}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
