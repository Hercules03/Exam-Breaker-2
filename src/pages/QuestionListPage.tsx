import { useState, useMemo } from 'react';
import { SlidersHorizontal, Loader, Search, Bookmark, Sparkles, Target, ChevronDown } from 'lucide-react';
import { useQuestions, useDomains } from '../hooks/useQuestions';
import { useAnswerStatus } from '../hooks/useAnswers';
import { useOverallStats } from '../hooks/useProgress';
import { useBookmarkedIds } from '../hooks/useBookmarks';
import { AnswerStatus } from '../types/index';
import { PageType, NavigationMode } from '../App';
import { QuestionService } from '../services/QuestionService';

interface QuestionListPageProps {
  onSelectQuestion: (id: number, navigationMode?: NavigationMode) => void;
  onNavigate: (page: PageType, questionId?: number, domain?: string, navigationMode?: NavigationMode) => void;
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
  const { ids: bookmarkedIds } = useBookmarkedIds();
  const [pickingRandom, setPickingRandom] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookmarkFilter, setBookmarkFilter] = useState(false);

  // Client-side search + bookmark filtering
  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (bookmarkFilter) {
      result = result.filter((q) => bookmarkedIds.has(q.id));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (q) =>
          q.stem.toLowerCase().includes(term) ||
          q.keywords.toLowerCase().includes(term)
      );
    }

    return result;
  }, [questions, searchTerm, bookmarkFilter, bookmarkedIds]);

  const handleRandomPick = async () => {
    try {
      setPickingRandom(true);
      const randomQuestion = await QuestionService.getRandomQuestion(selectedDomain, 'unanswered');
      if (randomQuestion) {
        onNavigate('detail', randomQuestion.id, selectedDomain, 'random');
      }
    } catch (err) {
      console.error('Failed to pick random question:', err);
    } finally {
      setPickingRandom(false);
    }
  };

  const handleReviewIncorrect = async () => {
    try {
      setPickingRandom(true);
      const randomQuestion = await QuestionService.getRandomQuestion(selectedDomain, 'answeredIncorrectly');
      if (randomQuestion) {
        onNavigate('detail', randomQuestion.id, selectedDomain, 'random');
      }
    } catch (err) {
      console.error('Failed to pick incorrect question:', err);
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
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-10 text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Questions Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Import your question bank to start studying.</p>
        <button
          onClick={() => onNavigate('settings')}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors active:scale-95 shadow-sm"
        >
          Import Questions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Overview Stats & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Card */}
        {overallStats && !statsLoading && (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-5 col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Accuracy</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                {overallStats.questionsAnswered > 0
                  ? Math.round((overallStats.questionsCorrect / overallStats.questionsAnswered) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    overallStats.questionsAnswered > 0
                      ? Math.round((overallStats.questionsCorrect / overallStats.questionsAnswered) * 100)
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {overallStats.questionsCorrect} of {overallStats.questionsAnswered} correct
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <button
            onClick={handleRandomPick}
            disabled={pickingRandom || domainsLoading || questionsLoading}
            className="flex flex-col items-center justify-center p-5 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-200 active:scale-95 group disabled:opacity-50"
          >
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Study Random</span>
          </button>
          <button
            onClick={handleReviewIncorrect}
            disabled={pickingRandom || domainsLoading || questionsLoading}
            className="flex flex-col items-center justify-center p-5 bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-200 active:scale-95 group disabled:opacity-50"
          >
            <Target className="w-6 h-6 text-rose-600 dark:text-rose-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Review Mistakes</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-[73px] z-30 bg-[#f8fafc]/90 dark:bg-[#0f172a]/90 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm font-medium"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-medium transition-all shadow-sm active:scale-95 ${
              showFilters 
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100' 
                : 'bg-white dark:bg-[#1e293b] border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-3 bg-white dark:bg-[#1e293b] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Domain Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Knowledge Domain
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => handleDomainChange(domain)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDomain === domain
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Question Status
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('unanswered')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    answerStatusFilter === 'unanswered'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Unanswered
                </button>
                <button
                  onClick={() => handleStatusChange('answeredCorrectly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    answerStatusFilter === 'answeredCorrectly'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                  }`}
                >
                  Mastered
                </button>
                <button
                  onClick={() => handleStatusChange('answeredIncorrectly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    answerStatusFilter === 'answeredIncorrectly'
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                  }`}
                >
                  Needs Review
                </button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 self-center hidden sm:block"></div>
                <button
                  onClick={() => setBookmarkFilter(!bookmarkFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    bookmarkFilter
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkFilter ? 'fill-white' : ''}`} />
                  Bookmarked
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4 pt-2">
        {questionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No questions match your current filters.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isBookmarked={bookmarkedIds.has(question.id)}
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
  isBookmarked: boolean;
  onSelect: () => void;
}

function QuestionCard({ question, isBookmarked, onSelect }: QuestionCardProps) {
  const { status, loading } = useAnswerStatus(question.id);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 p-5 group active:scale-[0.99] relative overflow-hidden"
    >
      {/* Subtle status indicator edge */}
      {!loading && status !== 'unanswered' && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          status === 'answeredCorrectly' ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
      )}

      {/* Top Row: Meta info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 tracking-wider">
            #{question.id}
          </span>
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md truncate max-w-[200px] sm:max-w-[300px]">
            {question.domainName || question.domain}
          </span>
        </div>
        {isBookmarked && (
          <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
        )}
      </div>

      {/* Question Stem */}
      <p className="text-slate-800 dark:text-slate-200 font-medium line-clamp-2 leading-relaxed mb-4 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
        {question.stem}
      </p>

      {/* Bottom Row: Status Badge */}
      {!loading && (
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${
              status === 'answeredCorrectly' ? 'bg-emerald-500' :
              status === 'answeredIncorrectly' ? 'bg-rose-500' :
              'bg-slate-300 dark:bg-slate-600'
            }`} />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {status === 'answeredCorrectly' ? 'Mastered' :
               status === 'answeredIncorrectly' ? 'Needs Review' :
               'Unattempted'}
            </span>
          </div>
          
          <span className="text-xs font-bold text-blue-600 dark:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Study <Search className="w-3 h-3" />
          </span>
        </div>
      )}
    </button>
  );
}
