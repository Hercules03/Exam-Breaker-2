import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Loader, Lightbulb, Key, Bookmark, RotateCcw, Timer as TimerIcon, Folder, StickyNote, Flag } from 'lucide-react';
import { useQuestion } from '../hooks/useQuestions';
import { useSubmitAnswer, useAnswerHistory } from '../hooks/useAnswers';
import { useBookmark } from '../hooks/useBookmarks';
import { useNote } from '../hooks/useNote';
import { useFlag } from '../hooks/useFlag';
import { PageType, NavigationMode } from '../App';
import { QuestionService } from '../services/QuestionService';
import { AnswerService } from '../services/AnswerService';
import { formatTime } from '../utils/formatting';
import LatexText from '../components/LatexText';
import FormattedText from '../components/FormattedText';
import { OptionCard } from '../components/OptionCard';
import { MobileActionBar } from '../components/MobileActionBar';
import { CollapsibleCard } from '../components/CollapsibleCard';
import { ResultBanner } from '../components/ResultBanner';

interface QuestionDetailPageProps {
  questionId: number;
  onBack: () => void;
  onNavigate: (page: PageType, questionId?: number, domain?: string, navigationMode?: NavigationMode) => void;
  navigationMode: NavigationMode;
  selectedDomain?: string;
}

export default function QuestionDetailPage({
  questionId,
  onBack,
  onNavigate,
  navigationMode,
  selectedDomain,
}: QuestionDetailPageProps) {
  const { question, loading: questionLoading } = useQuestion(questionId);
  const { submitAnswer, submitting, error: submitError } = useSubmitAnswer();
  const { history, refresh: refreshHistory } = useAnswerHistory(questionId);
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(questionId);
  const { note, saving: noteSaving, saveNote } = useNote(questionId);
  const { isFlagged: isQuestionFlagged, toggle: toggleFlag } = useFlag(questionId, 'study');
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean } | null>(null);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const prevQuestionIdRef = useRef(questionId);
  const isNavigatingRef = useRef(false);

  const isMultiAnswer = question?.correctAnswer?.includes(',') ?? false;

  const toggleAnswer = useCallback((option: string) => {
    if (isMultiAnswer) {
      setSelectedAnswers(prev => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
        } else {
          next.add(option);
        }
        return next;
      });
    } else {
      setSelectedAnswers(new Set([option]));
    }
  }, [isMultiAnswer]);

  const resetQuestionState = useCallback(() => {
    setSelectedAnswers(new Set());
    setShowExplanation(false);
    setSubmitResult(null);
    setSecondsSpent(0);
  }, []);

  // Fetch session progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const allQuestions = await QuestionService.getFilteredQuestions(selectedDomain);
        setTotalQuestions(allQuestions.length);
        const idx = allQuestions.findIndex(q => q.id === questionId);
        if (idx !== -1) setCurrentIndex(idx + 1);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    };
    fetchProgress();
  }, [questionId, selectedDomain]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showExplanation) {
        setSecondsSpent(s => s + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showExplanation, questionId]);

  // Reset states when question ID changes
  useEffect(() => {
    const isNewQuestion = prevQuestionIdRef.current !== questionId;
    prevQuestionIdRef.current = questionId;
    if (isNewQuestion) resetQuestionState();
  }, [questionId, resetQuestionState]);

  // If question was already answered, show explanation automatically
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    if (history.length > 0 && question && selectedAnswers.size === 0) {
      const lastAnswer = history[history.length - 1];
      setSelectedAnswers(new Set(lastAnswer.selectedAnswer.split(',')));
      setSubmitResult({ isCorrect: lastAnswer.isCorrect });
      setShowExplanation(true);
    }
  }, [history, question]);

  const handleNextQuestion = useCallback(async () => {
    try {
      isNavigatingRef.current = true;
      if (navigationMode === 'random') {
        const nextQuestion = await QuestionService.getRandomQuestion(selectedDomain, 'unanswered');
        if (nextQuestion) {
          onNavigate('detail', nextQuestion.id, selectedDomain, 'random');
        }
      } else {
        if (question) {
          const allQuestions = await QuestionService.getFilteredQuestions(selectedDomain);
          const currentIndex = allQuestions.findIndex(q => q.id === question.id);
          if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
            const nextQuestion = allQuestions[currentIndex + 1];
            onNavigate('detail', nextQuestion.id, selectedDomain, 'direct');
          }
        }
      }
    } catch (err) {
      console.error('Failed to navigate to next question:', err);
    }
  }, [navigationMode, selectedDomain, question, onNavigate]);

  const handleAnswerSubmit = useCallback(async () => {
    if (selectedAnswers.size === 0) return;
    const answerString = Array.from(selectedAnswers).sort().join(',');
    try {
      const result = await submitAnswer(questionId, answerString);
      setSubmitResult(result);
      await refreshHistory();
      setShowExplanation(true);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [selectedAnswers, questionId, submitAnswer, refreshHistory]);

  const handleReattempt = async () => {
    await AnswerService.clearAnswersForQuestion(questionId);
    await refreshHistory();
    resetQuestionState();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();

      if (!showExplanation && !submitting) {
        if (['A', 'B', 'C', 'D'].includes(key)) {
          toggleAnswer(key);
          return;
        }
      }

      if (e.key === 'Enter') {
        if (showExplanation) {
          handleNextQuestion();
        } else if (selectedAnswers.size > 0) {
          handleAnswerSubmit();
        }
        return;
      }

      if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showExplanation, submitting, selectedAnswers, handleNextQuestion, handleAnswerSubmit, onBack, toggleAnswer]);

  if (questionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-8 text-center max-w-lg mx-auto">
        <p className="text-slate-600 dark:text-slate-400 mb-6">Question not found.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
        >
          Go Back
        </button>
      </div>
    );
  }

  const options = ['A', 'B', 'C', 'D'] as const;
  const domainLabel = question.domainName
    ? `${question.domain} - ${question.domainName}`
    : question.domain;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Session Progress Tracker */}
      {currentIndex && totalQuestions && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{currentIndex} / {totalQuestions}</span>
          </div>
          <div className="w-32 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-500" 
              style={{ width: `${(currentIndex / totalQuestions) * 100}%` }} 
            />
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg tracking-wide uppercase">
            Q #{question.id}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg tracking-wide uppercase">
            <Folder className="w-3.5 h-3.5" />
            {domainLabel}
          </span>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
            <TimerIcon className="w-3.5 h-3.5" />
            {formatTime(secondsSpent)}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggleFlag}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
              aria-label={isQuestionFlagged ? 'Unflag question' : 'Flag for review'}
            >
              <Flag className={`w-5 h-5 transition-colors ${isQuestionFlagged ? 'text-orange-500 fill-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} />
            </button>
            <button
              onClick={toggleBookmark}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Bookmark className={`w-5 h-5 transition-colors ${isBookmarked ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} />
            </button>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 leading-[1.4]">
          <LatexText>{question.stem}</LatexText>
        </h2>

        {/* Multi-answer hint */}
        {isMultiAnswer && !showExplanation && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-400 text-sm font-medium">
            This question has multiple correct answers. Select all that apply.
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3.5">
          {options.map((option) => {
            const optionText = question[`option${option}`];
            const isSelected = selectedAnswers.has(option);
            const correctAnswers = question.correctAnswer.split(',');
            const isCorrect = correctAnswers.includes(option);
            const wasAnsweredIncorrectly =
              submitResult && !submitResult.isCorrect && isSelected;

            let status: 'default' | 'correct' | 'incorrect' = 'default';
            if (showExplanation) {
                if (isCorrect) status = 'correct';
                else if (wasAnsweredIncorrectly) status = 'incorrect';
            }

            return (
              <OptionCard
                key={option}
                letter={option}
                text={optionText as string}
                isSelected={isSelected}
                status={status}
                onClick={() => !showExplanation && toggleAnswer(option)}
                showFeedback={showExplanation}
              />
            );
          })}
        </div>

        {submitError && (
          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {submitError}
          </div>
        )}
      </div>

      {/* Result Banner */}
      {showExplanation && submitResult && (
        <ResultBanner
          isCorrect={submitResult.isCorrect}
          correctAnswer={question.correctAnswer}
          action={
            <button
              onClick={handleReattempt}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Re-attempt
            </button>
          }
        />
      )}

      {/* Explanation Cards */}
      {showExplanation && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {question.whyCorrect && (
            <CollapsibleCard
              icon={<div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>}
              title="Why it's Correct"
              defaultOpen={submitResult ? !submitResult.isCorrect : false}
            >
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <FormattedText text={question.whyCorrect} />
              </div>
            </CollapsibleCard>
          )}

          {question.whyIncorrect && (
            <CollapsibleCard
              icon={<div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg"><XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" /></div>}
              title="Why Others are Incorrect"
              defaultOpen={submitResult ? !submitResult.isCorrect : false}
            >
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <FormattedText text={question.whyIncorrect} />
              </div>
            </CollapsibleCard>
          )}

          {question.simplified && (
            <CollapsibleCard
              icon={<div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg"><Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>}
              title="Simplified Explanation"
            >
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <FormattedText text={question.simplified} />
              </div>
            </CollapsibleCard>
          )}

          {question.keywords && (
            <CollapsibleCard
              icon={<div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg"><Key className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>}
              title="Key Words"
            >
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                <FormattedText text={question.keywords} />
              </div>
            </CollapsibleCard>
          )}
        </div>
      )}

      {/* Answer History */}
      {history.length > 0 && (
        <CollapsibleCard title="Previous Attempts">
          <div className="space-y-3">
            {history.map((answer, index) => (
              <div key={answer.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  {answer.isCorrect ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Attempt {index + 1}: Selected {answer.selectedAnswer}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {new Date(answer.answeredAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* My Notes */}
      <CollapsibleCard
        icon={<StickyNote className={`w-5 h-5 ${note ? 'text-amber-500' : 'text-slate-400'}`} />}
        title="My Notes"
        badge={<>
          {note && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          {noteSaving && <span className="text-xs text-slate-400 ml-2">Saving...</span>}
        </>}
      >
        <textarea
          value={note}
          onChange={(e) => saveNote(e.target.value)}
          placeholder="Add your personal notes here... (e.g., &quot;Remember: ISACA perspective, not real-world&quot;)"
          className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
        />
      </CollapsibleCard>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-sm font-medium text-slate-400 dark:text-slate-500 pb-4">
        A / B / C / D to {isMultiAnswer ? 'toggle' : 'select'} &bull; Enter to submit/next
      </div>

      {/* Sticky Action Footer */}
      <MobileActionBar 
        onCheck={handleAnswerSubmit}
        onNext={handleNextQuestion}
        onBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        canCheck={selectedAnswers.size > 0}
        isAnswered={showExplanation}
        isSubmitting={submitting}
      />
    </div>
  );
}
