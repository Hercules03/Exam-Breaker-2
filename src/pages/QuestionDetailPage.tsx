import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Lightbulb, Key, Bookmark, RotateCcw, ArrowRight, Timer as TimerIcon, Folder } from 'lucide-react';
import { useQuestion } from '../hooks/useQuestions';
import { useSubmitAnswer, useAnswerHistory } from '../hooks/useAnswers';
import { useBookmark } from '../hooks/useBookmarks';
import { PageType, NavigationMode } from '../App';
import { QuestionService } from '../services/QuestionService';
import { AnswerService } from '../services/AnswerService';
import LatexText from '../components/LatexText';

/**
 * Render multi-line text with bullet point formatting
 */
function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="space-y-2">
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="ml-4 flex gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <LatexText>{content}</LatexText>
            </div>
          );
        }

        if (line.startsWith('\t') && (trimmed.startsWith('•') || trimmed.startsWith('-'))) {
          const content = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <div key={idx} className="ml-6 flex gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <LatexText>{content}</LatexText>
            </div>
          );
        }

        if (trimmed.startsWith('➡')) {
          return (
            <p key={idx} className="text-slate-700 dark:text-slate-300 font-medium mt-2">
              <LatexText>{trimmed}</LatexText>
            </p>
          );
        }

        if (trimmed === '⸻' || trimmed === '---') {
          return <hr key={idx} className="border-slate-200 dark:border-slate-700/50 my-3" />;
        }

        const optionHeaderMatch = trimmed.match(/^([A-D])[.)]+\s+(.*)/);
        if (optionHeaderMatch) {
          return (
            <p key={idx} className="font-semibold text-slate-900 dark:text-slate-100 mt-4">
              <LatexText>{trimmed}</LatexText>
            </p>
          );
        }

        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200">
            <LatexText>{trimmed}</LatexText>
          </p>
        );
      })}
    </div>
  );
}

interface QuestionDetailPageProps {
  questionId: number;
  onBack: () => void;
  onNavigate: (page: PageType, questionId?: number, domain?: string, navigationMode?: NavigationMode) => void;
  navigationMode: NavigationMode;
  selectedDomain?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean } | null>(null);
  const [showWhyCorrect, setShowWhyCorrect] = useState(false);
  const [showWhyIncorrect, setShowWhyIncorrect] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const prevQuestionIdRef = useRef(questionId);
  const isNavigatingRef = useRef(false);

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setSubmitResult(null);
    setShowWhyCorrect(false);
    setShowWhyIncorrect(false);
    setShowSimplified(false);
    setShowKeywords(false);
    setShowHistory(false);
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

    if (history.length > 0 && question && selectedAnswer === null) {
      const lastAnswer = history[history.length - 1];
      setSelectedAnswer(lastAnswer.selectedAnswer as 'A' | 'B' | 'C' | 'D');
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
    if (!selectedAnswer) return;
    try {
      const result = await submitAnswer(questionId, selectedAnswer);
      setSubmitResult(result);
      await refreshHistory();
      setShowExplanation(true);
      
      // Intelligent Auto-Expansion: If incorrect, show explanations automatically
      if (!result.isCorrect) {
        setShowWhyCorrect(true);
        setShowWhyIncorrect(true);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [selectedAnswer, questionId, submitAnswer, refreshHistory]);

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
          setSelectedAnswer(key as 'A' | 'B' | 'C' | 'D');
          return;
        }
      }

      if (e.key === 'Enter') {
        if (showExplanation) {
          handleNextQuestion();
        } else if (selectedAnswer) {
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
  }, [showExplanation, submitting, selectedAnswer, handleNextQuestion, handleAnswerSubmit, onBack]);

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

          <button
            onClick={toggleBookmark}
            className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Bookmark className={`w-5 h-5 transition-colors ${isBookmarked ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} />
          </button>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 leading-[1.4]">
          <LatexText>{question.stem}</LatexText>
        </h2>

        {/* Answer Options */}
        <div className="space-y-3.5">
          {options.map((option) => {
            const optionText = question[`option${option}`];
            const isSelected = selectedAnswer === option;
            const correctAnswers = question.correctAnswer.split(',');
            const isCorrect = correctAnswers.includes(option);
            const wasAnsweredIncorrectly =
              submitResult && !submitResult.isCorrect && isSelected;

            let bgColor = 'bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800/50';
            let borderColor = 'border-slate-200 dark:border-slate-700/80';
            let textColor = 'text-slate-900 dark:text-slate-100';

            if (showExplanation) {
              if (isCorrect) {
                bgColor = 'bg-emerald-50/50 dark:bg-emerald-500/10';
                borderColor = 'border-emerald-500/50 dark:border-emerald-500/30';
                textColor = 'text-emerald-900 dark:text-emerald-100';
              } else if (wasAnsweredIncorrectly) {
                bgColor = 'bg-rose-50/50 dark:bg-rose-500/10';
                borderColor = 'border-rose-500/50 dark:border-rose-500/30';
                textColor = 'text-rose-900 dark:text-rose-100';
              }
            } else if (isSelected) {
              bgColor = 'bg-blue-50/50 dark:bg-blue-500/10';
              borderColor = 'border-blue-500';
            }

            return (
              <button
                key={option}
                onClick={() => !showExplanation && setSelectedAnswer(option)}
                disabled={showExplanation || submitting}
                className={`w-full text-left p-4 md:p-5 border-2 rounded-2xl transition-all duration-200 group ${
                  !showExplanation ? 'active:scale-[0.98]' : 'cursor-default'
                } ${bgColor} ${borderColor} ${
                  isSelected && !showExplanation ? 'shadow-sm animate-pulse-subtle' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full border-2 font-bold text-base transition-colors ${
                    showExplanation
                      ? isCorrect
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-transparent'
                        : wasAnsweredIncorrectly
                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-transparent'
                        : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                      : isSelected
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-transparent'
                      : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}>
                    {option}
                  </div>
                  <div className="flex-1 pt-1.5 md:pt-2.5">
                    <p className={`font-semibold text-base md:text-lg leading-relaxed ${textColor}`}><LatexText>{optionText}</LatexText></p>
                  </div>
                  {showExplanation && isCorrect && (
                    <CheckCircle className="w-7 h-7 text-emerald-500 flex-shrink-0 mt-2" />
                  )}
                  {showExplanation && wasAnsweredIncorrectly && (
                    <XCircle className="w-7 h-7 text-rose-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              </button>
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
      {showExplanation && (
        <div className={`rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300 ${
          submitResult?.isCorrect 
            ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20' 
            : 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20'
        }`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              {submitResult?.isCorrect ? (
                <>
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Correct!</h3>
                </>
              ) : (
                <>
                  <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-500" />
                  <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400">Incorrect</h3>
                </>
              )}
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium ml-10">
              {question.correctAnswer.includes(',')
                ? <>The correct answers are <strong>{question.correctAnswer.split(',').join(', ')}</strong></>
                : <>The correct answer is <strong>{question.correctAnswer}</strong></>
              }
            </p>
          </div>
          
          <button
            onClick={handleReattempt}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Re-attempt
          </button>
        </div>
      )}

      {/* Explanation Cards */}
      {showExplanation && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {/* Why Correct */}
          {question.whyCorrect && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setShowWhyCorrect(!showWhyCorrect)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Why it's Correct</h3>
                </div>
                {showWhyCorrect ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {showWhyCorrect && (
                <div className="px-6 pb-6 pt-2 text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mt-2">
                  <FormattedText text={question.whyCorrect} />
                </div>
              )}
            </div>
          )}

          {/* Why Others Incorrect */}
          {question.whyIncorrect && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setShowWhyIncorrect(!showWhyIncorrect)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Why Others are Incorrect</h3>
                </div>
                {showWhyIncorrect ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {showWhyIncorrect && (
                <div className="px-6 pb-6 pt-2 text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mt-2">
                  <FormattedText text={question.whyIncorrect} />
                </div>
              )}
            </div>
          )}

          {/* Simplified */}
          {question.simplified && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setShowSimplified(!showSimplified)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Simplified Explanation</h3>
                </div>
                {showSimplified ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {showSimplified && (
                <div className="px-6 pb-6 pt-2 text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mt-2">
                  <FormattedText text={question.simplified} />
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          {question.keywords && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setShowKeywords(!showKeywords)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Key Words</h3>
                </div>
                {showKeywords ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {showKeywords && (
                <div className="px-6 pb-6 pt-2 text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mt-2">
                  <FormattedText text={question.keywords} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Answer History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Previous Attempts</h3>
            {showHistory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2 space-y-3">
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
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-sm font-medium text-slate-400 dark:text-slate-500 pb-4">
        A / B / C / D to select &bull; Enter to submit/next
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] safe-area-inset-bottom p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          {!showExplanation ? (
            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer || submitting}
              className="flex-1 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed shadow-sm active:scale-[0.98] flex items-center justify-center"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Next Question
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
