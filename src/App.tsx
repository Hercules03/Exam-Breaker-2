import { useState } from 'react';
import { BookOpen, BarChart3, Upload, Settings, ArrowLeft } from 'lucide-react';
import QuestionListPage from './pages/QuestionListPage';
import ProgressPage from './pages/ProgressPage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import QuestionDetailPage from './pages/QuestionDetailPage';

export type PageType = 'list' | 'progress' | 'import' | 'settings' | 'detail';
export type NavigationMode = 'direct' | 'random';

interface NavigationState {
  page: PageType;
  selectedQuestionId?: number;
  selectedDomain?: string;
  navigationMode?: NavigationMode;
}

function App() {
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
      case 'import':
        return (
          <ImportPage
            onNavigate={navigateTo}
            onBack={goBack}
          />
        );
      case 'settings':
        return (
          <SettingsPage
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDetailPage && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              Exam Breaker
            </h1>
          </div>

          {!isDetailPage && (
            <nav className="hidden md:flex gap-4">
              <button
                onClick={() => navigateTo('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  navigationState.page === 'list'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Questions
              </button>
              <button
                onClick={() => navigateTo('progress')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  navigationState.page === 'progress'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Progress
              </button>
              <button
                onClick={() => navigateTo('import')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  navigationState.page === 'import'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Upload className="w-5 h-5" />
                Import
              </button>
              <button
                onClick={() => navigateTo('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  navigationState.page === 'settings'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="hidden md:block bg-gray-100 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Exam Breaker - Multiple Choice Revision Companion</p>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      {!isDetailPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
          <div className="flex justify-around items-center h-16 safe-area-inset-bottom">
            {/* Questions Tab */}
            <button
              onClick={() => navigateTo('list')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition ${
                navigationState.page === 'list'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Questions"
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Questions</span>
            </button>

            {/* Progress Tab */}
            <button
              onClick={() => navigateTo('progress')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition ${
                navigationState.page === 'progress'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Progress"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Progress</span>
            </button>

            {/* Import Tab */}
            <button
              onClick={() => navigateTo('import')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition ${
                navigationState.page === 'import'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Import"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Import</span>
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => navigateTo('settings')}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition ${
                navigationState.page === 'settings'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
