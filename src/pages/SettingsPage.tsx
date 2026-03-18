import { useState, useRef } from 'react';
import { Settings, AlertCircle, CheckCircle, Moon, Sun, Download, Upload, ShieldAlert, Database, Info, FileJson, FileText, ArrowRight } from 'lucide-react';
import { PageType } from '../App';
import { db } from '../db/database';
import { QuestionService } from '../services/QuestionService';
import { AnswerService } from '../services/AnswerService';
import { BookmarkService } from '../services/BookmarkService';
import { ExportService } from '../services/ExportService';
import { useImportCSV } from '../hooks/useImport';

interface SettingsPageProps {
  onNavigate: (page: PageType, questionId?: number, domain?: string) => void;
  onBack: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

export default function SettingsPage({
  onNavigate,
  onBack: _onBack,
  isDark,
  toggleDark,
}: SettingsPageProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearType, setClearType] = useState<'answers' | 'all' | null>(null);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { importFromFile, importing, error: csvError, result: csvResult, reset: csvReset } = useImportCSV();

  const handleClearAnswers = async () => {
    try {
      setClearing(true);
      await AnswerService.clearAllAnswers();
      setMessage({ type: 'success', text: 'All answers cleared successfully' });
      setShowClearConfirm(false);
      setClearType(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to clear answers' });
    } finally {
      setClearing(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearing(true);
      await QuestionService.deleteAllQuestions();
      await AnswerService.clearAllAnswers();
      await BookmarkService.clearAll();
      await db.importLogs.clear();
      setMessage({ type: 'success', text: 'All data cleared successfully' });
      setShowClearConfirm(false);
      setClearType(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to clear data' });
    } finally {
      setClearing(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await ExportService.exportProgress();
      const date = new Date().toISOString().split('T')[0];
      ExportService.downloadAsFile(json, `exam-breaker-backup-${date}.json`);
      setMessage({ type: 'success', text: 'Backup downloaded successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to export' });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const result = await ExportService.importProgress(content);
      setMessage({
        type: 'success',
        text: `Imported ${result.answersImported} answers and ${result.bookmarksImported} bookmarks`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to import backup' });
    }

    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      csvReset();
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;
    try {
      await importFromFile(csvFile);
      setCsvFile(null);
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    } catch {
      // error is already set in the hook
    }
  };

  const handleDownloadDemo = () => {
    const link = document.createElement('a');
    link.href = '/Exam-Breaker-2/demo.csv';
    link.download = 'demo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your app preferences and data</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      {/* Preferences */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Preferences</h3>
        </div>

        <div className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h4>
              <p className="text-sm text-slate-500">{isDark ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>

          <button
            onClick={toggleDark}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              isDark ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={isDark}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Import Question Bank */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Import Question Bank</h3>
        </div>

        <div className="p-6 space-y-5">
          {/* File Picker */}
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              csvFile ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileChange}
              className="hidden"
              id="csv-file-upload"
            />
            <label
              htmlFor="csv-file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className={`p-3 rounded-full ${csvFile ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <FileText className={`w-7 h-7 ${csvFile ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400'}`} />
              </div>
              {csvFile ? (
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">{csvFile.name}</span>
              ) : (
                <span className="text-base font-bold text-blue-600 dark:text-blue-500 hover:text-blue-700 transition-colors">
                  Click to select a CSV file
                </span>
              )}
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Must follow the required template format
              </p>
            </label>
          </div>

          <button
            onClick={handleCsvImport}
            disabled={!csvFile || importing}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            {importing ? 'Importing Data...' : 'Start Import'}
            {!importing && <ArrowRight className="w-4 h-4" />}
          </button>

          {/* CSV Import Error */}
          {csvError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="text-rose-700 dark:text-rose-400 text-sm font-medium">{csvError}</div>
            </div>
          )}

          {/* CSV Import Success */}
          {csvResult && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 mb-1">Import Successful!</h3>
              <p className="text-emerald-700 dark:text-emerald-500 text-sm mb-3">
                Imported {csvResult.questionsImported} questions.
                {csvResult.questionsSkipped > 0 && ` Skipped ${csvResult.questionsSkipped}.`}
              </p>
              <button
                onClick={() => onNavigate('list')}
                className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors active:scale-95 shadow-sm text-sm"
              >
                Go to Questions
              </button>
            </div>
          )}

          {/* Demo Template Download */}
          <button
            onClick={handleDownloadDemo}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-sm"
          >
            <Download className="w-4 h-4" />
            Download Demo Template
          </button>
        </div>
      </div>

      {/* Data Management (Backup Export/Import) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Backup & Restore</h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {/* Export */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl mt-0.5">
                <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Export Backup</h4>
                <p className="text-sm text-slate-500 mt-1">Download answers and bookmarks</p>
              </div>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center gap-2 sm:w-auto w-full"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Import Backup */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl mt-0.5">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Import Backup</h4>
                <p className="text-sm text-slate-500 mt-1">Restore from a previous backup file</p>
              </div>
            </div>
            <label className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center gap-2 cursor-pointer sm:w-auto w-full">
              <Upload className="w-4 h-4" />
              Import
              <input
                ref={backupFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-rose-200/50 dark:border-rose-900/30 overflow-hidden">
        <div className="p-6 border-b border-rose-100 dark:border-rose-900/20 bg-rose-50/50 dark:bg-rose-500/5">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-500 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Danger Zone
          </h3>
        </div>

        <div className="divide-y divide-rose-100 dark:divide-rose-900/20">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Reset Progress</h4>
              <p className="text-sm text-slate-500 mt-1">Clear answer history but keep questions</p>
            </div>
            <button
              onClick={() => { setClearType('answers'); setShowClearConfirm(true); }}
              disabled={clearing}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors active:scale-95 sm:w-auto w-full"
            >
              Clear Progress
            </button>
          </div>

          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Wipe Database</h4>
              <p className="text-sm text-slate-500 mt-1">Delete questions, answers, and bookmarks</p>
            </div>
            <button
              onClick={() => { setClearType('all'); setShowClearConfirm(true); }}
              disabled={clearing}
              className="px-5 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors active:scale-95 sm:w-auto w-full"
            >
              Delete All Data
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="px-6 py-4 flex flex-col items-center justify-center text-center space-y-4 text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Database className="w-4 h-4" />
          Data is stored locally on your device
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4" />
          Exam Breaker v2.0
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl max-w-sm w-full p-8 border border-slate-200/50 dark:border-slate-700/50 scale-in-95">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Are you sure?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
              {clearType === 'answers'
                ? 'This will wipe all your practice history. Your questions will remain.'
                : 'This is a hard reset. All questions, answers, and bookmarks will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowClearConfirm(false); setClearType(null); }}
                disabled={clearing}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={clearType === 'answers' ? handleClearAnswers : handleClearAll}
                disabled={clearing}
                className="flex-1 py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors active:scale-95 disabled:opacity-50"
              >
                {clearing ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
