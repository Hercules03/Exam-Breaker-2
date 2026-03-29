import React from 'react';
import { ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';

interface ActionBarProps {
  onCheck: () => void;
  onNext: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  canCheck: boolean;
  isAnswered: boolean;
  isSubmitting?: boolean;
}

export const MobileActionBar: React.FC<ActionBarProps> = ({
  onCheck,
  onNext,
  onBookmark,
  isBookmarked,
  canCheck,
  isAnswered,
  isSubmitting = false
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-md mx-auto flex items-center gap-3">
        {/* Bookmark Toggle */}
        <button
          onClick={onBookmark}
          className={`p-4 rounded-2xl transition-all active:scale-90 ${
            isBookmarked 
              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {isBookmarked ? <BookmarkCheck className="w-6 h-6 fill-current" /> : <Bookmark className="w-6 h-6" />}
        </button>

        {/* Primary Action Button */}
        {!isAnswered ? (
          <button
            onClick={onCheck}
            disabled={!canCheck || isSubmitting}
            className={`flex-grow flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg ${
              canCheck && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? 'Checking...' : 'Check Answer'}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex-grow flex items-center justify-center gap-2 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            Next Question
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
