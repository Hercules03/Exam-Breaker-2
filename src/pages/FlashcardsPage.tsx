import { useState, useEffect, useCallback } from 'react';
import { Loader, RotateCcw, ArrowLeft, ArrowRight, Shuffle, Layers, ChevronLeft } from 'lucide-react';
import { FlashcardService, Flashcard } from '../services/FlashcardService';
import { useDomains } from '../hooks/useQuestions';
import { PageType } from '../App';
import LatexText from '../components/LatexText';

interface FlashcardsPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
  onBack: () => void;
}

export default function FlashcardsPage({ onNavigate: _onNavigate, onBack }: FlashcardsPageProps) {
  const { domains } = useDomains();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>();
  const [started, setStarted] = useState(false);

  // Load cards
  useEffect(() => {
    setLoading(true);
    FlashcardService.getAllFlashcards(selectedDomain).then((result) => {
      setAllCards(result);
      setCards(FlashcardService.shuffle(result));
      setCurrentIndex(0);
      setFlipped(false);
      setLoading(false);
    });
  }, [selectedDomain]);

  const handleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const handleShuffle = useCallback(() => {
    setCards(FlashcardService.shuffle(allCards));
    setCurrentIndex(0);
    setFlipped(false);
  }, [allCards]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!started) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'Escape':
          onBack();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, handleFlip, handleNext, handlePrev, onBack]);

  // Setup view
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <Layers className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Flashcards</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Learn key terms and definitions</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : allCards.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No flashcards available. Import questions with keywords first.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Domain Filter */}
              {domains.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 block">
                    Focus Domain
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDomain(undefined)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                        !selectedDomain
                          ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                          : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      All ({allCards.length})
                    </button>
                    {domains.map((d) => {
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDomain(d)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                            selectedDomain === d
                              ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                              : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 text-center">
                <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{cards.length}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">cards ready to study</p>
              </div>

              <button
                onClick={() => { handleShuffle(); setStarted(true); }}
                disabled={cards.length === 0}
                className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-200 dark:disabled:bg-slate-800 shadow-sm flex items-center justify-center gap-2"
              >
                <Shuffle className="w-5 h-5" />
                Start Studying
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Study view
  const card = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isLast = currentIndex === cards.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header Bar */}
      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Exit
          </button>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">
            {currentIndex + 1} <span className="text-slate-400 font-medium">/ {cards.length}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-90"
              aria-label="Shuffle"
              title="Shuffle cards"
            >
              <Shuffle className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={handleRestart}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-90"
              aria-label="Restart"
              title="Go to first card"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flip Card */}
      {card && (
        <div className="perspective-1000">
          <button
            onClick={handleFlip}
            className="w-full cursor-pointer focus:outline-none"
            aria-label={flipped ? 'Show term' : 'Show definition'}
          >
            <div
              className={`relative w-full transition-transform duration-500 transform-style-3d ${
                flipped ? 'rotate-y-180' : ''
              }`}
              style={{ minHeight: '320px' }}
            >
              {/* Front - Term */}
              <div
                className={`absolute inset-0 backface-hidden rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-8 md:p-10 flex flex-col items-center justify-center text-center transition-colors ${
                  flipped
                    ? 'pointer-events-none'
                    : 'bg-white dark:bg-[#1e293b]'
                }`}
              >
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-6">
                  Term
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  <LatexText>{card.term}</LatexText>
                </h2>
                <p className="text-sm text-slate-400 mt-6">Tap to reveal definition</p>
              </div>

              {/* Back - Definition */}
              <div
                className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl shadow-sm border border-blue-200/60 dark:border-blue-800/40 p-8 md:p-10 flex flex-col items-center justify-center text-center transition-colors ${
                  flipped
                    ? 'bg-blue-50/50 dark:bg-blue-500/5'
                    : 'pointer-events-none'
                }`}
              >
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-6">
                  Definition
                </span>
                <p className="text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  <LatexText>{card.definition}</LatexText>
                </p>
                <div className="mt-6 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-xs font-medium text-slate-500">
                    {card.domainName || card.domain}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Completion Card */}
      {isLast && flipped && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 rounded-2xl p-6 text-center">
          <p className="text-emerald-700 dark:text-emerald-400 font-bold">You've reviewed all {cards.length} cards!</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors active:scale-95 text-sm"
            >
              Review Again
            </button>
            <button
              onClick={() => { handleShuffle(); }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 text-sm"
            >
              Shuffle & Restart
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-2 pointer-events-none">
        <div className="max-w-2xl mx-auto flex gap-3 pointer-events-auto">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={handleFlip}
            className="flex-1 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
          >
            {flipped ? 'Show Term' : 'Flip Card'}
          </button>
          <button
            onClick={handleNext}
            disabled={isLast}
            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2 hidden md:block">
          Space/Enter to flip &middot; Arrow keys to navigate &middot; Esc to exit
        </p>
      </div>
    </div>
  );
}
