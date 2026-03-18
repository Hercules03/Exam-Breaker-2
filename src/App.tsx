import { useState } from 'react';
import { Layers, TrendingUp, SlidersHorizontal, ArrowLeft, Timer, BookOpen, Wallet } from 'lucide-react';
import { useDarkMode } from './hooks/useDarkMode';
import QuestionListPage from './pages/QuestionListPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import ExamPage from './pages/ExamPage';
import FlashcardsPage from './pages/FlashcardsPage';

export type PageType = 'list' | 'progress' | 'settings' | 'detail' | 'exam' | 'flashcards';
export type NavigationMode = 'direct' | 'random';

interface NavigationState {
  page: PageType;
  selectedQuestionId?: number;
  selectedDomain?: string;
  navigationMode?: NavigationMode;
}

function App() {
  const [isDark, toggleDark] = useDarkMode();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    page: 'list',
  });

  const navigateTo = (page: PageType, questionId?: number, domain?: string, navigationMode: NavigationMode = 'direct') => {
    setNavigationState({
      page,
      selectedQuestionId: questionId,
      selectedDomain: domain,
      navigationMode,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setNavigationState({ page: 'list' });
  };

  const renderPage = () => {
    switch (navigationState.page) {
      case 'list':
        return (
          <QuestionListPage
            onSelectQuestion={(id, navigationMode) => navigateTo('detail', id, undefined, navigationMode)}
            onNavigate={navigateTo}
          />
        );
      case 'progress':
        return (
          <ProgressPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            onNavigate={navigateTo}
            onBack={goBack}
            isDark={isDark}
            toggleDark={toggleDark}
          />
        );
      case 'exam':
        return (
          <ExamPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );
      case 'flashcards':
        return (
          <FlashcardsPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );
      case 'detail':
        return (
          <QuestionDetailPage
            questionId={navigationState.selectedQuestionId || 0}
            onBack={goBack}
            onNavigate={navigateTo}
            navigationMode={navigationState.navigationMode || 'direct'}
            selectedDomain={navigationState.selectedDomain}
          />
        );
      default:
        return <QuestionListPage onSelectQuestion={(id, navigationMode) => navigateTo('detail', id, undefined, navigationMode)} onNavigate={navigateTo} />;
    }
  };

  const isDetailPage = navigationState.page === 'detail';
  const isExamPage = navigationState.page === 'exam';
  const isFlashcardsPage = navigationState.page === 'flashcards';
  const hideNav = isDetailPage || isExamPage || isFlashcardsPage;

  const navItems = [
    { page: 'list' as PageType, icon: Layers, label: 'Questions' },
    { page: 'exam' as PageType, icon: Timer, label: 'Exam' },
    { page: 'flashcards' as PageType, icon: Wallet, label: 'Cards' },
    { page: 'progress' as PageType, icon: TrendingUp, label: 'Progress' },
    { page: 'settings' as PageType, icon: SlidersHorizontal, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      {/* Header - Sticky with Frosted Glass */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDetailPage && (
              <button
                onClick={goBack}
                className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Exam Breaker
              </span>
            </h1>
          </div>

          {!hideNav && (
            <nav className="hidden md:flex gap-2">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => navigateTo(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    navigationState.page === item.page
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${navigationState.page === item.page ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-5xl mx-auto px-4 py-6 ${hideNav ? 'pb-32 md:pb-12' : 'pb-28 md:pb-12'}`}>
        {renderPage()}
      </main>

      {/* Mobile Bottom Tab Bar - Frosted Glass App-like Nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:hidden safe-area-inset-bottom">
          <div className="flex justify-around items-center h-[4.5rem] px-2">
            {navItems.map((item) => {
              const isActive = navigationState.page === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => navigateTo(item.page)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 px-2 h-full rounded-2xl transition-all active:scale-95 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  aria-label={item.label}
                >
                  <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}>
                    <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'}`} />
                  </div>
                  <span className={`text-[10px] mt-1 tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
