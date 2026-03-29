import { useState } from 'react';
import { Download, Upload as UploadIcon, CheckCircle, AlertCircle, FileText, Settings, ShieldAlert, ArrowRight } from 'lucide-react';
import { useImportCSV as useImport } from '../hooks/useImport';
import { PageType } from '../App';

interface ImportPageProps {
  onNavigate: (page: PageType) => void;
}

export default function ImportPage({ onNavigate }: ImportPageProps) {
  const { importFromFile, importing, error, result, reset } = useImport();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      reset();
    }
  };

  const handleImport = async () => {
    if (!file) return;
    await importFromFile(file);
    setFile(null);
  };

  const handleDownloadDemo = () => {
    // Assuming the demo CSV is in the public directory or accessible via this path
    const link = document.createElement('a');
    link.href = '/demo.csv';
    link.download = 'demo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 dark:border-slate-800/60 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
            <UploadIcon className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Import Question Bank</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Upload a CSV file to add questions</p>
          </div>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              file ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className={`p-4 rounded-full ${file ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <FileText className={`w-8 h-8 ${file ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400'}`} />
              </div>
              <div>
                {file ? (
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{file.name}</span>
                ) : (
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-500 hover:text-blue-700 transition-colors">
                    Click to select a CSV file
                  </span>
                )}
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                  Must follow the required template format
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            {importing ? 'Importing Data...' : 'Start Import'}
            {!importing && <ArrowRight className="w-5 h-5" />}
          </button>

          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="text-rose-700 dark:text-rose-400 text-sm font-medium">{error}</div>
            </div>
          )}

          {result && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-1">Import Successful!</h3>
              <p className="text-emerald-700 dark:text-emerald-500 text-sm mb-4">
                Imported {result.questionsImported} questions.
                {result.questionsSkipped > 0 && ` Skipped ${result.questionsSkipped}.`}
              </p>
              <button
                onClick={() => onNavigate('list')}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors active:scale-95 shadow-sm"
              >
                Go to Questions
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Template Requirements
        </h3>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <p className="leading-relaxed">
            Your CSV file <strong className="text-slate-900 dark:text-slate-100">must</strong> contain the following headers in exact order:
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
            Domain, DomainName, ID, Stem, Option A, Option B, Option C, Option D, Correct, Simplified, Key Words, Correct Explanation, Incorrect Explanation
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mt-6">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800 dark:text-amber-400 font-medium">
              <p className="mb-2"><strong>Important Formatting Rules:</strong></p>
              <ul className="list-disc pl-4 space-y-1 opacity-90">
                <li>Double quotes (") inside text MUST be escaped with another double quote ("").</li>
                <li>Fields containing commas or line breaks MUST be wrapped in double quotes.</li>
                <li>The CSV must be encoded in UTF-8.</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadDemo}
          className="mt-8 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
        >
          <Download className="w-5 h-5" />
          Download Demo Template
        </button>
      </div>
    </div>
  );
}
