import { Loader, RefreshCw, TrendingUp, Target, Award, BrainCircuit } from 'lucide-react';
import { useOverallStats, useAllDomainStats } from '../hooks/useProgress';
import { PageType } from '../App';

interface ProgressPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
  onBack: () => void;
}

export default function ProgressPage({
  onNavigate,
  onBack: _onBack,
}: ProgressPageProps) {
  const { stats: overallStats, loading: overallLoading, refresh: refreshOverall } = useOverallStats();
  const { stats: domainStats, loading: domainLoading, refresh: refreshDomain } = useAllDomainStats();

  const handleRefresh = async () => {
    await Promise.all([refreshOverall(), refreshDomain()]);
  };

  const getMasteryColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'progressing':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'needsReview':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      case 'notStarted':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getMasteryProgressColor = (status: string) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500';
      case 'progressing': return 'bg-blue-500';
      case 'needsReview': return 'bg-amber-500';
      default: return 'bg-slate-300 dark:bg-slate-600';
    }
  };

  if (overallLoading && domainLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (overallStats && overallStats.totalQuestions === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-24 flex flex-col items-center justify-center mt-12">
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-10 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No Progress Yet!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
            You haven't imported any questions yet. Head over to the Settings tab to get started.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = overallStats
    ? Math.round((overallStats.questionsAnswered / Math.max(overallStats.totalQuestions, 1)) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Overall Stats */}
      {overallStats && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Overall Progress</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Your learning journey at a glance</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-90"
              aria-label="Refresh stats"
            >
              <RefreshCw className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Questions */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Q's</p>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-200">
                {overallStats.totalQuestions}
              </p>
            </div>

            {/* Answered */}
            <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Attempted</p>
              </div>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-400">
                {overallStats.questionsAnswered}
              </p>
              <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 mt-1">
                {completionPercentage}% complete
              </p>
            </div>

            {/* Correct */}
            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Correct</p>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                {overallStats.questionsCorrect}
              </p>
              <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-500/70 mt-1">
                {overallStats.questionsAnswered > 0
                  ? Math.round((overallStats.questionsCorrect / overallStats.questionsAnswered) * 100)
                  : 0}
                % accuracy
              </p>
            </div>

            {/* Mastery */}
            <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-100 dark:border-amber-500/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Mastery</p>
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-500">
                {overallStats.averageMasteryPercentage}%
              </p>
              <p className="text-xs font-medium text-amber-600/70 dark:text-amber-500/70 mt-1">
                Avg. confidence
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Course Completion</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{completionPercentage}%</p>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${completionPercentage}%` }}
              >
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Stats */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-400" />
          Domain Performance
        </h3>

        {domainLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : domainStats && domainStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainStats.map((domain) => (
              <div key={domain.domain} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                      {domain.domainName || domain.domain}
                    </h4>
                    <p className="text-xs font-medium text-slate-500">
                      {domain.questionsCorrect} of {domain.totalQuestions} correct
                      {domain.questionsAnswered > 0 && (
                        <span className="text-slate-400 ml-1">({Math.round((domain.questionsCorrect / domain.questionsAnswered) * 100)}%)</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getMasteryColor(
                      domain.masteryStatus
                    )}`}
                  >
                    {domain.masteryStatus === 'notStarted' && 'Not Started'}
                    {domain.masteryStatus === 'needsReview' && 'Review'}
                    {domain.masteryStatus === 'progressing' && 'Learning'}
                    {domain.masteryStatus === 'mastered' && 'Mastered'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mastery</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{domain.masteryPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ease-out ${getMasteryProgressColor(domain.masteryStatus)}`}
                      style={{ width: `${domain.masteryPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No progress data yet. Start studying to see your stats.</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {domainStats && domainStats.length > 0 && (
        <button
          onClick={() => onNavigate('list')}
          className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
        >
          Continue Practice
        </button>
      )}
    </div>
  );
}
