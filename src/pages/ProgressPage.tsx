import { BarChart3, Loader, RefreshCw } from 'lucide-react';
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
        return 'bg-correct text-white';
      case 'progressing':
        return 'bg-progressing text-gray-900';
      case 'needsReview':
        return 'bg-warning text-white';
      case 'notStarted':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (overallLoading && domainLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const completionPercentage = overallStats
    ? Math.round((overallStats.questionsAnswered / Math.max(overallStats.totalQuestions, 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {overallStats && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Overall Progress
            </h2>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Questions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Total Questions</p>
              <p className="text-3xl font-bold text-blue-700">
                {overallStats.totalQuestions}
              </p>
            </div>

            {/* Answered */}
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Answered</p>
              <p className="text-3xl font-bold text-purple-700">
                {overallStats.questionsAnswered}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {completionPercentage}% complete
              </p>
            </div>

            {/* Correct */}
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Correct</p>
              <p className="text-3xl font-bold text-correct">
                {overallStats.questionsCorrect}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {overallStats.questionsAnswered > 0
                  ? Math.round(
                      (overallStats.questionsCorrect / overallStats.questionsAnswered) * 100
                    )
                  : 0}
                % accuracy
              </p>
            </div>

            {/* Mastery */}
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Avg Mastery</p>
              <p className="text-3xl font-bold text-warning">
                {overallStats.averageMasteryPercentage}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {overallStats.domainsMastered}/{overallStats.domainsStarted} domains mastered
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Completion Progress</p>
              <p className="text-sm font-medium text-gray-700">{completionPercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Domain Stats */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Domain Performance</h3>

        {domainLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : domainStats && domainStats.length > 0 ? (
          <div className="space-y-4">
            {domainStats.map((domain) => (
              <div key={domain.domain} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {domain.domain}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {domain.questionsCorrect} of {domain.totalQuestions} correct
                      {domain.questionsAnswered > 0 && (
                        <span> ({Math.round((domain.questionsCorrect / domain.questionsAnswered) * 100)}% accuracy)</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getMasteryColor(
                      domain.masteryStatus
                    )}`}
                  >
                    {domain.masteryStatus === 'notStarted' && 'Not Started'}
                    {domain.masteryStatus === 'needsReview' && 'Needs Review'}
                    {domain.masteryStatus === 'progressing' && 'Progressing'}
                    {domain.masteryStatus === 'mastered' && 'Mastered'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        domain.masteryStatus === 'mastered'
                          ? 'bg-correct'
                          : domain.masteryStatus === 'progressing'
                            ? 'bg-progressing'
                            : domain.masteryStatus === 'needsReview'
                              ? 'bg-warning'
                              : 'bg-gray-300'
                      }`}
                      style={{
                        width: `${domain.masteryPercentage}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {domain.masteryPercentage}% mastery
                  </p>
                </div>

                {/* Questions Count */}
                <div className="text-xs text-gray-600">
                  {domain.totalQuestions} total • {domain.questionsAnswered} answered
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">
            No progress data yet. Start answering questions to see your progress.
          </p>
        )}
      </div>

      {/* Action Button */}
      {domainStats && domainStats.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('list')}
            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Continue Practice
          </button>
        </div>
      )}
    </div>
  );
}
