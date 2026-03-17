import { useState } from 'react';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { PageType } from '../App';
import { db } from '../db/database';
import { QuestionService } from '../services/QuestionService';
import { AnswerService } from '../services/AnswerService';

interface SettingsPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
  onBack: () => void;
}

export default function SettingsPage({
  onNavigate: _onNavigate,
  onBack,
}: SettingsPageProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearType, setClearType] = useState<'answers' | 'all' | null>(null);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClearAnswers = async () => {
    try {
      setClearing(true);
      await AnswerService.clearAllAnswers();
      setMessage({ type: 'success', text: 'All answers cleared successfully' });
      setShowClearConfirm(false);
      setClearType(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to clear answers',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await QuestionService.deleteAllQuestions();
      await AnswerService.clearAllAnswers();
      await db.importLogs.clear();
      setMessage({ type: 'success', text: 'All data cleared successfully' });
      setShowClearConfirm(false);
      setClearType(null);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to clear data',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
          <Settings className="w-7 h-7 text-blue-600" />
          Settings
        </h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-correct text-correct'
                : 'bg-red-50 border border-incorrect text-incorrect'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Clear Answers Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Answer History</h3>
            <p className="text-gray-600 text-sm mb-4">
              Remove all your answers while keeping the questions intact. This will reset your progress.
            </p>
            <button
              onClick={() => {
                setClearType('answers');
                setShowClearConfirm(true);
              }}
              disabled={clearing}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400"
            >
              Clear Answers
            </button>
          </div>

          {/* Clear All Section */}
          <div className="border border-red-200 rounded-lg p-6 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Clear All Data</h3>
            <p className="text-red-800 text-sm mb-4">
              Remove all questions, answers, and import history. This action cannot be undone.
            </p>
            <button
              onClick={() => {
                setClearType('all');
                setShowClearConfirm(true);
              }}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
            >
              Clear All Data
            </button>
          </div>

          {/* About Section */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Exam Breaker</strong> - Multiple Choice Revision Companion
              </p>
              <p>Version 1.0.0</p>
              <p>A web-based application for practicing and mastering multiple-choice questions offline.</p>
            </div>
          </div>

          {/* Storage Info */}
          <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Local Storage</h3>
            <p className="text-blue-800 text-sm">
              All your questions and answers are stored locally in your browser using IndexedDB.
              No data is sent to any server.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={onBack}
        className="w-full py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
      >
        Back
      </button>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Confirm Delete</h3>
            </div>

            <p className="text-gray-700 mb-6">
              {clearType === 'answers'
                ? 'Are you sure you want to clear all answer history? Your questions will remain.'
                : 'Are you sure you want to delete all data? This action cannot be undone.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearType(null);
                }}
                disabled={clearing}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={
                  clearType === 'answers'
                    ? handleClearAnswers
                    : handleClearAll
                }
                disabled={clearing}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {clearing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
