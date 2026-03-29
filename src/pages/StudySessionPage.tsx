import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Loader, RotateCcw, Trophy, Folder } from 'lucide-react';
import { useStudySession } from '../hooks/useStudySession';
import { useQuestion } from '../hooks/useQuestions';
import { useSubmitAnswer } from '../hooks/useAnswers';
import { useBookmark } from '../hooks/useBookmarks';
import { StudySessionConfig } from '../types/index';
import LatexText from '../components/LatexText';
import FormattedText from '../components/FormattedText';
import { OptionCard } from '../components/OptionCard';
import { MobileActionBar } from '../components/MobileActionBar';
import { ResultBanner } from '../components/ResultBanner';
import { EmptyState } from '../components/EmptyState';
import { safePercent } from '../utils/formatting';

interface StudySessionPageProps {
  config: StudySessionConfig;
  onBack: () => void;
}

export default function StudySessionPage({ config, onBack }: StudySessionPageProps) {
  const session = useStudySession(config);

  if (config.questionIds.length === 0) {
    return (
      <EmptyState
        icon={<Folder className="w-8 h-8 text-slate-400" />}
        title="No Questions Found"
        description="There are no questions matching this study mode."
        actionLabel="Go Back"
        onAction={onBack}
      />
    );
  }

  if (session.completed) {
    return <SessionComplete stats={session.stats} label={config.label} onBack={onBack} onRestart={session.reset} />;
  }

  return (
    <SessionQuestion
      key={session.currentQuestionId!}
      questionId={session.currentQuestionId!}
      currentIndex={session.currentIndex}
      total={session.total}
      label={config.label}
      onAnswer={session.recordAnswer}
      onNext={session.goNext}
    />
  );
}

function SessionQuestion({
  questionId,
  currentIndex,
  total,
  label,
  onAnswer,
  onNext,
}: {
  questionId: number;
  currentIndex: number;
  total: number;
  label: string;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}) {
  const { question, loading } = useQuestion(questionId);
  const { submitAnswer, submitting } = useSubmitAnswer();
  const { isBookmarked, toggle: toggleBookmark } = useBookmark(questionId);
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean } | null>(null);

  const isMultiAnswer = question?.correctAnswer?.includes(',') ?? false;

  const toggleAnswer = useCallback((option: string) => {
    if (showExplanation) return;
    setSelectedAnswers((prev) => {
      const next = new Set(prev);
      if (isMultiAnswer) {
        if (next.has(option)) next.delete(option);
        else next.add(option);
      } else {
        next.clear();
        next.add(option);
      }
      return next;
    });
  }, [isMultiAnswer, showExplanation]);

  const handleSubmit = useCallback(async () => {
    if (selectedAnswers.size === 0 || !question) return;
    const answerStr = Array.from(selectedAnswers).sort().join(',');
    const result = await submitAnswer(questionId, answerStr);
    if (result) {
      setSubmitResult(result);
      setShowExplanation(true);
      onAnswer(result.isCorrect);
    }
  }, [selectedAnswers, question, questionId, submitAnswer, onAnswer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key) && !showExplanation) {
        toggleAnswer(key);
      } else if (e.key === 'Enter') {
        if (!showExplanation && selectedAnswers.size > 0) {
          handleSubmit();
        } else if (showExplanation) {
          onNext();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showExplanation, selectedAnswers, toggleAnswer, handleSubmit, onNext]);

  if (loading || !question) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const options = ['A', 'B', 'C', 'D'] as const;
  const correctSet = new Set(question.correctAnswer.split(','));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <div className="bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider">
            {label}
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-bold">
            {currentIndex + 1} <span className="text-slate-400 font-medium">/ {total}</span>
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        <div className="mb-4">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg tracking-wide uppercase">
            {question.domainName || question.domain}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-8 leading-relaxed">
          <LatexText>{question.stem}</LatexText>
        </h2>

        {isMultiAnswer && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-400 text-sm font-medium">
            Select all correct answers.
          </div>
        )}

        <div className="space-y-3.5">
          {options.map((option) => {
            const isSelected = selectedAnswers.has(option);
            const isCorrectOpt = correctSet.has(option);
            const wasAnsweredIncorrectly = submitResult && !submitResult.isCorrect && isSelected;

            let status: 'default' | 'correct' | 'incorrect' = 'default';
            if (showExplanation) {
              if (isCorrectOpt) status = 'correct';
              else if (wasAnsweredIncorrectly) status = 'incorrect';
            }

            return (
              <OptionCard
                key={option}
                letter={option}
                text={question[`option${option}`] as string}
                isSelected={isSelected}
                status={status}
                onClick={() => !showExplanation && toggleAnswer(option)}
                showFeedback={showExplanation}
              />
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="space-y-4">
          {/* Result Banner */}
          {submitResult && (
            <ResultBanner
              isCorrect={submitResult.isCorrect}
              correctAnswer={question.correctAnswer}
            />
          )}

          {/* Explanations */}
          {question.whyCorrect && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Why Correct
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <FormattedText text={question.whyCorrect} />
              </div>
            </div>
          )}

          {!submitResult?.isCorrect && question.whyIncorrect && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Why Others Incorrect
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <FormattedText text={question.whyIncorrect} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky Action Footer */}
      <MobileActionBar
        onCheck={handleSubmit}
        onNext={onNext}
        onBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        canCheck={selectedAnswers.size > 0}
        isAnswered={showExplanation}
        isSubmitting={submitting}
      />
    </div>
  );
}

function SessionComplete({
  stats,
  label,
  onBack,
  onRestart,
}: {
  stats: { total: number; answered: number; correct: number };
  label: string;
  onBack: () => void;
  onRestart: () => void;
}) {
  const percentage = safePercent(stats.correct, stats.answered);
  const passed = percentage >= 70;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className={`rounded-3xl shadow-sm border p-10 text-center relative overflow-hidden ${
        passed
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20'
          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-2 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Trophy className={`w-8 h-8 ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>

        <div className={`text-6xl font-black tracking-tight mb-3 ${passed ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
          {percentage}%
        </div>

        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
          {stats.correct} of {stats.answered} correct
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5 text-center">
          <p className="text-3xl font-black text-slate-800 dark:text-slate-200">{stats.total}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5 text-center">
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{stats.correct}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Correct</p>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5 text-center">
          <p className="text-3xl font-black text-rose-600 dark:text-rose-500">{stats.answered - stats.correct}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Incorrect</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRestart}
          className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Restart
        </button>
        <button
          onClick={onBack}
          className="py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
