import { useState, useEffect } from 'react';
import { Timer, CheckCircle, XCircle, Loader, AlertCircle, Play, ListOrdered, Hash, Flag, ChevronDown, ChevronUp, TrendingUp, Target, Brain } from 'lucide-react';
import { useExam } from '../hooks/useExam';
import { useDomains } from '../hooks/useQuestions';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useFlag, useFlaggedIds } from '../hooks/useFlag';
import { ExamConfig } from '../types/index';
import { PageType } from '../App';
import LatexText from '../components/LatexText';
import QuestionExplanation from '../components/QuestionExplanation';
import { formatTime, safePercent } from '../utils/formatting';

interface ExamPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
}

export default function ExamPage({ onNavigate }: ExamPageProps) {
  const exam = useExam();

  if (exam.result) {
    return <CATExamResults exam={exam} onNavigate={onNavigate} />;
  }

  if (exam.session) {
    return <CATExamInProgress exam={exam} />;
  }

  return <CATExamSetup exam={exam} />;
}

// Helper: compute question range from time
function computeQuestionRange(timeLimitMinutes: number): { min: number; max: number } {
  const min = Math.max(5, Math.round((timeLimitMinutes / 180) * 100));
  const max = Math.max(min + 2, Math.round((timeLimitMinutes / 180) * 150));
  return { min, max };
}

// --- Setup View ---
function CATExamSetup({ exam }: { exam: ReturnType<typeof useExam> }) {
  const { domains } = useDomains();
  const [timeLimit, setTimeLimit] = useState(180);
  const [domain, setDomain] = useState<string | undefined>();

  const { min, max } = computeQuestionRange(timeLimit);

  const handleStart = () => {
    const config: ExamConfig = {
      timeLimitMinutes: timeLimit,
      minQuestions: min,
      maxQuestions: max,
      domain,
    };
    exam.startExam(config);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <Brain className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CAT Exam Simulation</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Computerized Adaptive Testing</p>
          </div>
        </div>

        {/* CAT Info */}
        <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-2xl p-5 mb-8">
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            Questions adapt to your ability level in real-time. The exam ends early when confident in your result, or at the maximum question count. You <span className="font-semibold">cannot go back</span> to previous questions. Passing score: <span className="font-semibold">700 / 1000</span>.
          </p>
        </div>

        <div className="space-y-8">
          {/* Time Limit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <Timer className="w-4 h-4 text-slate-400" />
              Time Limit (minutes)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[15, 30, 60, 90, 180].map((n) => (
                <button
                  key={n}
                  onClick={() => setTimeLimit(n)}
                  className={`py-3 rounded-xl font-medium transition-all active:scale-95 border-2 ${
                    timeLimit === n
                      ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Adaptive range: <span className="font-semibold text-slate-700 dark:text-slate-300">{min} - {max} questions</span>
            </p>
          </div>

          {/* Domain Filter */}
          {domains.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                <ListOrdered className="w-4 h-4 text-slate-400" />
                Focus Domain
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDomain(undefined)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                    !domain
                      ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  All Domains
                </button>
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                      domain === d
                        ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={exam.loading}
          className="w-full mt-10 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-200 dark:disabled:bg-slate-800 shadow-sm flex items-center justify-center gap-2"
        >
          {exam.loading ? (
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Begin CAT Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --- CAT In Progress View ---
function CATExamInProgress({ exam }: { exam: ReturnType<typeof useExam> }) {
  const { session, currentQuestion, timeRemaining, questionsAnswered, minQuestions, maxQuestions, selectedAnswer, setSelectedAnswer } = exam;
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const barHidden = useScrollDirection();
  const flagContext = session ? `exam-${session.id}` : 'exam';
  const { refresh: refreshFlags } = useFlaggedIds(flagContext);

  if (!session || !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-10 text-center">
        <p className="text-slate-600 dark:text-slate-400">No questions available for this configuration.</p>
        <button
          onClick={exam.resetExam}
          className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
        >
          Go Back
        </button>
      </div>
    );
  }

  const questionNumber = questionsAnswered + 1;
  const isTimeLow = timeRemaining <= 120;
  const hasAnswer = !!selectedAnswer;

  // Progress: show as fraction of min-max range
  const progressPercentage = Math.min(100, (questionsAnswered / minQuestions) * 100);

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    await exam.submitAnswer(selectedAnswer);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-[73px] z-30 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-4 -mx-2 px-6 sm:mx-0 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">
              Q{questionNumber} <span className="text-slate-400 font-medium">of {minQuestions}-{maxQuestions}</span>
            </span>
            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
              CAT
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-mono text-lg font-bold tracking-tight ${
            isTimeLow
              ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}>
            <Timer className="w-5 h-5" />
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question with Flag */}
      <CATQuestionWithFlag
        question={currentQuestion}
        selectedAnswer={selectedAnswer || undefined}
        onSelect={setSelectedAnswer}
        flagContext={flagContext}
        onFlagToggle={refreshFlags}
      />

      {/* Fixed Bottom Action Bar */}
      <div className={`fixed left-0 right-0 z-50 px-4 pb-3 pt-2 pointer-events-none transition-all duration-300 ease-in-out ${barHidden ? 'bottom-0 translate-y-full md:bottom-0 md:translate-y-full' : 'bottom-[4.5rem] translate-y-0 md:bottom-0 md:translate-y-0'}`}>
        <div className="max-w-3xl mx-auto mb-2 text-center pointer-events-auto">
          <button
             onClick={() => setShowQuitConfirm(true)}
             className="text-sm font-medium text-slate-400 hover:text-rose-500 transition-colors"
          >
            End Simulation Early
          </button>
        </div>
        <div className="max-w-3xl mx-auto flex gap-3 pointer-events-auto">
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer || exam.loading}
            className={`flex-1 py-4 font-semibold text-lg rounded-xl transition-colors shadow-sm active:scale-[0.98] ${
              hasAnswer
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            {exam.loading ? (
              <Loader className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Submit & Continue'
            )}
          </button>
        </div>
      </div>

      {/* Quit Confirmation */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl max-w-sm w-full p-8 border border-slate-200/50 dark:border-slate-700/50 scale-in-95">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Quit Simulation?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">All current progress will be lost and won't be saved to your history.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Cancel</button>
              <button onClick={exam.resetExam} className="flex-1 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors active:scale-95">Quit Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Single Exam Question (uses Question object directly for CAT) ---
function CATQuestion({ question, selectedAnswer, onSelect }: {
  question: { stem: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; domain: string; domainName: string };
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
}) {
  const isMultiAnswer = question.correctAnswer.includes(',');
  const selectedSet = new Set(selectedAnswer ? selectedAnswer.split(',') : []);

  const handleToggle = (option: string) => {
    if (isMultiAnswer) {
      const next = new Set(selectedSet);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      onSelect(Array.from(next).sort().join(','));
    } else {
      onSelect(option);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleToggle(key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedAnswer, isMultiAnswer]);

  const options = ['A', 'B', 'C', 'D'] as const;
  const optionMap = { A: question.optionA, B: question.optionB, C: question.optionC, D: question.optionD };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
      <div className="mb-6">
        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg tracking-wide uppercase">
          {question.domainName || question.domain}
        </span>
      </div>
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-8 leading-relaxed">
        <LatexText>{question.stem}</LatexText>
      </h2>
      {isMultiAnswer && (
        <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-400 text-sm font-medium">
          This question has multiple correct answers. Select all that apply.
        </div>
      )}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedSet.has(option);
          return (
            <button
              key={option}
              onClick={() => handleToggle(option)}
              className={`w-full text-left p-4 md:p-5 border-2 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#1e293b] hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 font-bold text-sm md:text-base transition-colors ${
                  isSelected
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-transparent'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                  {option}
                </div>
                <div className="flex-1 pt-1.5 md:pt-2">
                  <p className={`font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                    <LatexText>{optionMap[option]}</LatexText>
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- CAT Question with Flag button ---
function CATQuestionWithFlag({ question, selectedAnswer, onSelect, flagContext, onFlagToggle }: {
  question: { id: number; stem: string; optionA: string; optionB: string; optionC: string; optionD: string; correctAnswer: string; domain: string; domainName: string };
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  flagContext: string;
  onFlagToggle: () => void;
}) {
  const { isFlagged, toggle: toggleFlag } = useFlag(question.id, flagContext);

  return (
    <div className="relative">
      <button
        onClick={async () => { await toggleFlag(); onFlagToggle(); }}
        className={`absolute top-4 right-4 z-10 p-2.5 rounded-xl transition-all active:scale-90 ${
          isFlagged
            ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-orange-500'
        }`}
        aria-label={isFlagged ? 'Unflag question' : 'Flag for review'}
      >
        <Flag className={`w-5 h-5 ${isFlagged ? 'fill-current' : ''}`} />
      </button>
      <CATQuestion question={question} selectedAnswer={selectedAnswer} onSelect={onSelect} />
    </div>
  );
}

// --- Ability Trend Sparkline ---
function AbilityTrendChart({ history }: { history: { questionNumber: number; ability: number; se: number }[] }) {
  if (history.length < 2) return null;

  const w = 320;
  const h = 80;
  const pad = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const abilities = history.map((h) => h.ability);
  const minA = Math.min(...abilities, -1);
  const maxA = Math.max(...abilities, 1);
  const range = maxA - minA || 1;

  const points = history.map((h, i) => {
    const x = pad.left + (i / (history.length - 1)) * chartW;
    const y = pad.top + chartH - ((h.ability - minA) / range) * chartH;
    return `${x},${y}`;
  });

  // Passing line at theta = 2.0 (700/1000)
  const passingTheta = 2.0;
  const passingY = pad.top + chartH - ((passingTheta - minA) / range) * chartH;

  return (
    <svg width={w} height={h} className="w-full max-w-xs">
      {/* Passing threshold line */}
      {passingTheta >= minA && passingTheta <= maxA && (
        <line x1={pad.left} y1={passingY} x2={w - pad.right} y2={passingY}
          stroke="currentColor" className="text-emerald-400 dark:text-emerald-600" strokeWidth="1" strokeDasharray="4 3" />
      )}
      {/* Ability line */}
      <polyline
        fill="none"
        stroke="currentColor"
        className="text-blue-500"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
      {/* Final dot */}
      {history.length > 0 && (() => {
        const last = history[history.length - 1];
        const x = pad.left + ((history.length - 1) / (history.length - 1)) * chartW;
        const y = pad.top + chartH - ((last.ability - minA) / range) * chartH;
        return <circle cx={x} cy={y} r="3" fill="currentColor" className="text-blue-600" />;
      })()}
    </svg>
  );
}

// --- CAT Results View ---
function CATExamResults({ exam, onNavigate }: { exam: ReturnType<typeof useExam>; onNavigate: (page: PageType, questionId?: number, domain?: string) => void }) {
  const { result } = exam;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const flagContext = result?.session ? `exam-${result.session.id}` : 'exam';
  const { ids: flaggedIds } = useFlaggedIds(flagContext);

  if (!result) return null;

  const handleSave = async () => {
    setSaving(true);
    await exam.saveToProgress();
    setSaved(true);
    setSaving(false);
  };

  const { catData } = result;
  const passed = catData.passed;
  const flaggedCount = flaggedIds.size;
  const luckyGuesses = result.questionResults.filter((qr) => qr.isCorrect && flaggedIds.has(qr.questionId)).length;

  const terminationLabel = {
    confidence: 'Confidence threshold met',
    maxQuestions: 'Maximum questions reached',
    timeUp: 'Time expired',
  }[catData.terminationReason];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Score Header */}
      <div className={`rounded-3xl shadow-sm border p-10 text-center relative overflow-hidden ${
        passed
          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20'
          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20'
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-2 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest ${
            passed ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
          }`}>
            {passed ? 'Exam Passed' : 'Needs Practice'}
          </span>
        </div>

        {/* Scaled Score */}
        <div className={`text-7xl font-black tracking-tight mb-1 ${passed ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
          {catData.scaledScore}
        </div>
        <p className="text-lg font-medium text-slate-400 mb-3">
          out of 1000
        </p>

        <p className="text-base font-medium text-slate-600 dark:text-slate-400">
          {result.score} of {result.totalQuestions} correct ({result.percentage}%)
        </p>

        {/* CAT Metadata */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-full font-medium text-slate-600 dark:text-slate-300">
            <Target className="w-3.5 h-3.5" />
            {catData.questionsAttempted} of {catData.maxQuestions} max
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-full font-medium text-slate-600 dark:text-slate-300">
            <TrendingUp className="w-3.5 h-3.5" />
            {terminationLabel}
          </span>
        </div>

        {flaggedCount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 rounded-full font-medium">
              <Flag className="w-3.5 h-3.5" /> {flaggedCount} flagged
            </span>
            {luckyGuesses > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                {luckyGuesses} lucky {luckyGuesses === 1 ? 'guess' : 'guesses'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ability Trend */}
      {catData.abilityHistory.length >= 2 && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-400" />
            Ability Trend
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Your estimated ability over the course of the exam. Dashed line = passing threshold.</p>
          <div className="flex justify-center">
            <AbilityTrendChart history={catData.abilityHistory} />
          </div>
        </div>
      )}

      {/* Domain Breakdown */}
      {result.domainBreakdown.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-slate-400" />
            Performance by Domain
          </h3>
          <div className="space-y-5">
            {result.domainBreakdown.map((d) => {
              const domainPercent = safePercent(d.correct, d.total);
              const isDomainPass = domainPercent >= 70;

              return (
                <div key={d.domain}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{d.domainName}</span>
                    <span className={`text-sm font-bold ${isDomainPass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {domainPercent}% <span className="text-slate-400 font-medium ml-1">({d.correct}/{d.total})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isDomainPass ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${domainPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Results Log */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Hash className="w-5 h-5 text-slate-400" />
            Question Review
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Expand any question for an inline explanation.</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {result.questionResults.map((qr, idx) => {
            const isExpanded = expandedQuestion === qr.questionId;
            return (
              <div key={qr.questionId}>
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : qr.questionId)}
                  className="w-full flex items-center justify-between p-4 md:px-8 md:py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      qr.isCorrect ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/20'
                    }`}>
                      {qr.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        Question {idx + 1}
                        {flaggedIds.has(qr.questionId) && <Flag className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />}
                      </span>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Your answer: <span className="font-semibold text-slate-700 dark:text-slate-300">{qr.selectedAnswer || 'Skipped'}</span>
                        {!qr.isCorrect && <span className="ml-2 text-rose-500 font-semibold">Correct: {qr.correctAnswer}</span>}
                      </div>
                    </div>
                  </div>

                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {isExpanded && (
                  <div className="px-4 md:px-8 pb-5 border-t border-slate-100 dark:border-slate-800/50 pt-4">
                    <QuestionExplanation
                      questionId={qr.questionId}
                      selectedAnswer={qr.selectedAnswer}
                      correctAnswer={qr.correctAnswer}
                      isCorrect={qr.isCorrect}
                    />
                    <button
                      onClick={() => onNavigate('detail', qr.questionId)}
                      className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Full Detail
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {!saved ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save to Progress'}
          </button>
        ) : (
          <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-lg rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            Saved to History
          </div>
        )}
        <button
          onClick={exam.resetExam}
          className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-lg rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
        >
          New Exam
        </button>
      </div>
    </div>
  );
}
