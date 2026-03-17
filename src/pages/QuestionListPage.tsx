import { useState } from 'react';
import { Filter, Loader, Shuffle } from 'lucide-react';
import { useQuestions, useDomains } from '../hooks/useQuestions';
import { useAnswerStatus } from '../hooks/useAnswers';
import { useOverallStats } from '../hooks/useProgress';
import { AnswerStatus } from '../types/index';
import { PageType, NavigationMode } from '../App';
import { QuestionService } from '../services/QuestionService';

interface QuestionListPageProps {
  onSelectQuestion: (id: number, navigationMode?: NavigationMode) => void;
  onNavigate: (page: PageType) => void;
}

export default function QuestionListPage({
  onSelectQuestion,
  onNavigate,
}: QuestionListPageProps) {
  const { domains, loading: domainsLoading } = useDomains();
  const { stats: overallStats, loading: statsLoading } = useOverallStats();
  const [selectedDomain, setSelectedDomain] = useState<string>();
  const [answerStatusFilter, setAnswerStatusFilter] = useState<AnswerStatus | undefined>();
  const { questions, loading: questionsLoading } = useQuestions(selectedDomain, answerStatusFilter);
  const [pickingRandom, setPickingRandom] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleRandomPick = async () => {
    try {
      setPickingRandom(true);
      // Get a random unanswered question
      const randomQuestion = await QuestionService.getRandomQuestion(undefined, 'unanswered');
      if (randomQuestion) {
        onSelectQuestion(randomQuestion.id, 'random');
      }
    } catch (err) {
      console.error('Failed to pick random question:', err);
    } finally {
      setPickingRandom(false);
    }
  };

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain === selectedDomain ? undefined : domain);
  };

  const handleStatusChange = (status: AnswerStatus) => {
    setAnswerStatusFilter(status === answerStatusFilter ? undefined : status);
  };


  if (domainsLoading && questionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 mb-4">No questions imported yet.</p>
        <button
          onClick={() => onNavigate('import')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Import Questions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Accuracy Progress Bar */}
      {overallStats && !statsLoading && (
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200 z-40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Accuracy</span>
            <span className="text-sm font-semibold text-blue-600">
              {overallStats.questionsAnswered > 0
                ? Math.round(
                    (overallStats.questionsCorrect / overallStats.questionsAnswered) * 100
                  )
                : 0}
              % ({overallStats.questionsCorrect}/{overallStats.questionsAnswered})
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  overallStats.questionsAnswered > 0
                    ? Math.round(
                        (overallStats.questionsCorrect / overallStats.questionsAnswered) * 100
                      )
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Sticky Random Pick Button + Filter Toggle */}
      <div className="sticky top-12 bg-white px-4 py-3 border-b border-gray-200 z-40 shadow-sm flex items-center gap-3">
        <button
          onClick={handleRandomPick}
          disabled={pickingRandom || domainsLoading || questionsLoading}
          className="flex-1 py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
        >
          <Shuffle className="w-5 h-5" />
          {pickingRandom ? 'Picking...' : 'Pick Random'}
        </button>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-4 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center justify-center"
          aria-label="Toggle filters"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Sticky Collapsible Filters Panel */}
      {showFilters && (
        <div className="sticky top-24 bg-white border-b border-gray-200 z-40 shadow-sm">
          <div className="px-6 py-4 space-y-4">
            {/* Domain Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Domain
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => handleDomainChange(domain)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedDomain === domain
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Answer Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('unanswered')}
                  className={`px-4 py-2 rounded-lg transition ${
                    answerStatusFilter === 'unanswered'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unanswered
                </button>
                <button
                  onClick={() => handleStatusChange('answeredCorrectly')}
                  className={`px-4 py-2 rounded-lg transition ${
                    answerStatusFilter === 'answeredCorrectly'
                      ? 'bg-correct text-white'
                      : 'bg-green-100 text-correct hover:bg-green-200'
                  }`}
                >
                  Correct
                </button>
                <button
                  onClick={() => handleStatusChange('answeredIncorrectly')}
                  className={`px-4 py-2 rounded-lg transition ${
                    answerStatusFilter === 'answeredIncorrectly'
                      ? 'bg-incorrect text-white'
                      : 'bg-red-100 text-incorrect hover:bg-red-200'
                  }`}
                >
                  Incorrect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {questionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No questions match your filters.</p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onSelect={() => onSelectQuestion(question.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: any;
  onSelect: () => void;
}

function QuestionCard({ question, onSelect }: QuestionCardProps) {
  const { status, loading } = useAnswerStatus(question.id);

  const statusBg =
    status === 'answeredCorrectly'
      ? 'bg-green-50'
      : status === 'answeredIncorrectly'
        ? 'bg-red-50'
        : 'bg-gray-50';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-lg shadow hover:shadow-md transition p-4 ${statusBg}`}
    >
      {/* Top Row: Question # and Domain */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
          {question.id}
        </span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          {question.domain}
        </span>
      </div>

      {/* Middle: Question Text */}
      <p className="text-gray-900 font-medium mb-3">{question.stem}</p>

      {/* Bottom Row: Status */}
      {!loading && (
        <div className="flex justify-end">
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            status === 'answeredCorrectly'
              ? 'bg-green-100 text-correct'
              : status === 'answeredIncorrectly'
                ? 'bg-red-100 text-incorrect'
                : 'bg-gray-100 text-gray-600'
          }`}>
            {status === 'answeredCorrectly'
              ? '✓ Correct'
              : status === 'answeredIncorrectly'
                ? '✗ Incorrect'
                : 'Unanswered'}
          </span>
        </div>
      )}
    </button>
  );
}
