import { useState, useEffect } from 'react';
import { Timer, CheckCircle, XCircle, Loader, AlertCircle, Play, ListOrdered, Hash } from 'lucide-react';
import { useExam } from '../hooks/useExam';
import { useQuestion } from '../hooks/useQuestions';
import { useDomains } from '../hooks/useQuestions';
import { ExamConfig } from '../types/index';
import { PageType } from '../App';

interface ExamPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
  onBack: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ExamPage({ onNavigate, onBack: _onBack }: ExamPageProps) {
  const exam = useExam();

  if (exam.result) {
    return <ExamResults exam={exam} onNavigate={onNavigate} />;
  }

  if (exam.session) {
    return <ExamInProgress exam={exam} />;
  }

  return <ExamSetup exam={exam} />;
}

// --- Setup View ---
function ExamSetup({ exam }: { exam: ReturnType<typeof useExam> }) {
  const { domains } = useDomains();
  const [questionCount, setQuestionCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(30);
  const [domain, setDomain] = useState<string | undefined>();

  const handleStart = () => {
    const config: ExamConfig = {
      questionCount,
      timeLimitMinutes: timeLimit,
      domain,
    };
    exam.startExam(config);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-8">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <Timer className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Exam Simulation</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your practice environment</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Question Count */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <Hash className="w-4 h-4 text-slate-400" />
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`py-3 rounded-xl font-medium transition-all active:scale-95 border-2 ${
                    questionCount === n
                      ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              <Timer className="w-4 h-4 text-slate-400" />
              Time Limit (minutes)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[15, 30, 60, 90, 120].map((n) => (
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
              Begin Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --- In Progress View ---
function ExamInProgress({ exam }: { exam: ReturnType<typeof useExam> }) {
  const { session, currentIndex, timeRemaining } = exam;
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  if (!session || session.questionIds.length === 0) {
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

  const currentQuestionId = session.questionIds[currentIndex];
  const answeredCount = Object.keys(session.answers).length;
  const isTimeLow = timeRemaining <= 120; // Alert at 2 mins

  const progressPercentage = (answeredCount / session.questionIds.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Sticky Exam Header */}
      <div className="sticky top-[73px] z-30 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-4 -mx-2 px-6 sm:mx-0 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-bold tracking-wide">
              {currentIndex + 1} <span className="text-slate-400 font-medium">/ {session.questionIds.length}</span>
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

        {/* Mini Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <ExamQuestion
        questionId={currentQuestionId}
        selectedAnswer={session.answers[currentQuestionId]}
        onSelect={(answer) => exam.submitExamAnswer(currentQuestionId, answer)}
      />

      {/* Question Navigation Grid */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Question Navigator</h3>
        <div className="flex flex-wrap gap-2">
          {session.questionIds.map((qId, idx) => {
            const isAnswered = !!session.answers[qId];
            const isCurrent = idx === currentIndex;
            
            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
            if (isCurrent) {
              btnStyle = 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 ring-2 ring-slate-900/20 dark:ring-slate-100/20 ring-offset-2 dark:ring-offset-[#1e293b]';
            } else if (isAnswered) {
              btnStyle = 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400';
            }

            return (
              <button
                key={qId}
                onClick={() => exam.goToQuestion(idx)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border-2 active:scale-90 ${btnStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] safe-area-inset-bottom p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => exam.goToQuestion(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          
          {currentIndex < session.questionIds.length - 1 ? (
            <button
              onClick={() => exam.goToQuestion(currentIndex + 1)}
              className="flex-1 py-4 bg-blue-600 text-white font-semibold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="flex-1 py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 transition-colors shadow-sm active:scale-[0.98]"
            >
              Finish Exam
            </button>
          )}
        </div>
        <div className="max-w-3xl mx-auto mt-3 text-center">
          <button
             onClick={() => setShowQuitConfirm(true)}
             className="text-sm font-medium text-slate-400 hover:text-rose-500 transition-colors"
          >
            End Simulation Early
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

      {/* Finish Confirmation */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl max-w-sm w-full p-8 border border-slate-200/50 dark:border-slate-700/50 scale-in-95">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Finish Exam?</h3>
            <p className="text-slate-600 dark:text-slate-300 text-center mb-6 font-medium">
              {answeredCount} of {session.questionIds.length} answered
            </p>
            
            {answeredCount < session.questionIds.length && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-amber-800 dark:text-amber-400 text-sm font-medium text-center">
                  You have <span className="font-bold">{session.questionIds.length - answeredCount}</span> unanswered questions. They will be marked as incorrect.
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95">Review</button>
              <button onClick={() => { setShowFinishConfirm(false); exam.finishExam(); }} className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors active:scale-95">Submit Exam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Single Exam Question ---
function ExamQuestion({ questionId, selectedAnswer, onSelect }: {
  questionId: number;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  onSelect: (answer: 'A' | 'B' | 'C' | 'D') => void;
}) {
  const { question, loading } = useQuestion(questionId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        onSelect(key as 'A' | 'B' | 'C' | 'D');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelect]);

  if (loading || !question) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const options = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
      <div className="mb-6">
        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg tracking-wide uppercase">
          {question.domainName || question.domain}
        </span>
      </div>
      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-8 leading-relaxed">
        {question.stem}
      </h2>
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
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
                    {question[`option${option}`]}
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

// --- Results View ---
function ExamResults({ exam, onNavigate }: { exam: ReturnType<typeof useExam>; onNavigate: (page: PageType, questionId?: number, domain?: string) => void }) {
  const { result } = exam;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!result) return null;

  const handleSave = async () => {
    setSaving(true);
    await exam.saveToProgress();
    setSaved(true);
    setSaving(false);
  };

  const passed = result.percentage >= 70;

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
        
        <div className={`text-7xl font-black tracking-tight mb-3 ${passed ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
          {result.percentage}%
        </div>
        
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
          {result.score} out of {result.totalQuestions} correct
        </p>
      </div>

      {/* Domain Breakdown */}
      {result.domainBreakdown.length > 0 && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-slate-400" />
            Performance by Domain
          </h3>
          <div className="space-y-5">
            {result.domainBreakdown.map((d) => {
              const domainPercent = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tap any question to view its detailed explanation.</p>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {result.questionResults.map((qr, idx) => (
            <button
              key={qr.questionId}
              onClick={() => onNavigate('detail', qr.questionId)}
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
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Question {idx + 1}
                  </span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Your answer: <span className="font-semibold text-slate-700 dark:text-slate-300">{qr.selectedAnswer || 'Skipped'}</span>
                  </div>
                </div>
              </div>
              
              {!qr.isCorrect && (
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Correct</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{qr.correctAnswer}</div>
                </div>
              )}
            </button>
          ))}
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
