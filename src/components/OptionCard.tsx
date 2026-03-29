import React from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

interface OptionCardProps {
  letter: string;
  text: string;
  isSelected: boolean;
  status?: 'correct' | 'incorrect' | 'default';
  onClick: () => void;
  showFeedback: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  letter,
  text,
  isSelected,
  status = 'default',
  onClick,
  showFeedback
}) => {
  // Logic for dynamic colors based on state
  const getStyles = () => {
    if (showFeedback) {
      if (status === 'correct') return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500';
      if (status === 'incorrect' && isSelected) return 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500';
    }
    if (isSelected) return 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500';
    return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700';
  };

  const getIcon = () => {
    if (showFeedback) {
      if (status === 'correct') return <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />;
      if (status === 'incorrect' && isSelected) return <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/10" />;
    }
    return isSelected 
      ? <Circle className="w-5 h-5 text-blue-500 fill-blue-500" /> 
      : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />;
  };

  return (
    <button
      onClick={onClick}
      disabled={showFeedback}
      className={`group w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${getStyles()}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <span className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold transition-colors ${
          isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {letter}
        </span>
      </div>
      
      <div className="flex-grow text-[15px] font-medium leading-relaxed pt-0.5">
        {text}
      </div>

      <div className="flex-shrink-0 mt-0.5 opacity-80 group-active:scale-110 transition-transform">
        {getIcon()}
      </div>
    </button>
  );
};
