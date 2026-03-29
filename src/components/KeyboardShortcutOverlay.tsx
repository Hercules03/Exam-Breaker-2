import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { PageType } from '../App';

interface Shortcut {
  key: string;
  description: string;
  pages: PageType[];
}

const shortcuts: Shortcut[] = [
  { key: '?', description: 'Show keyboard shortcuts', pages: ['list', 'progress', 'settings', 'detail', 'exam', 'flashcards', 'studySession'] },
  { key: 'A / B / C / D', description: 'Select answer option', pages: ['detail', 'exam', 'studySession'] },
  { key: 'Enter', description: 'Submit answer / Next question', pages: ['detail', 'studySession'] },
  { key: 'Esc', description: 'Go back', pages: ['detail', 'studySession'] },
  { key: 'Space / Enter', description: 'Flip flashcard', pages: ['flashcards'] },
  { key: '\u2190 / \u2192', description: 'Previous / Next card', pages: ['flashcards'] },
  { key: 'Esc', description: 'Exit flashcards', pages: ['flashcards'] },
];

interface KeyboardShortcutOverlayProps {
  currentPage: PageType;
  isVisible: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutOverlay({ currentPage, isVisible, onClose }: KeyboardShortcutOverlayProps) {
  useEffect(() => {
    if (!isVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const relevant = shortcuts.filter((s) => s.pages.includes(currentPage));
  const global = shortcuts.filter((s) => s.pages.length >= 6);
  const pageSpecific = relevant.filter((s) => s.pages.length < 6);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl max-w-md w-full p-8 border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-90">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {pageSpecific.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">This Page</p>
            <div className="space-y-2.5">
              {pageSpecific.map((s, i) => (
                <ShortcutRow key={i} shortcut={s} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Global</p>
          <div className="space-y-2.5">
            {global.map((s, i) => (
              <ShortcutRow key={i} shortcut={s} />
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <p className="text-xs text-center text-slate-400">Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-mono text-xs border border-slate-200 dark:border-slate-700">Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600 dark:text-slate-300">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.key.split(' / ').map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs text-slate-400">/</span>}
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 min-w-[28px] text-center">
              {k.trim()}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}
