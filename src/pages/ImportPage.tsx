import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useImportCSV } from '../hooks/useImport';
import { PageType } from '../App';

interface ImportPageProps {
  onNavigate: (page: PageType) => void;
  onBack: () => void;
}

export default function ImportPage({
  onNavigate,
  onBack,
}: ImportPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const { importFromFile, importing, error, parseErrors, result, reset } = useImportCSV();

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      throw new Error('Please select a CSV file');
    }

    await importFromFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Upload className="w-7 h-7 text-blue-600" />
          Import Questions
        </h2>

        {!result ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Drag and drop your CSV file here
            </p>
            <p className="text-sm text-gray-600 mb-6">
              or click to select a file from your computer
            </p>

            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleChange}
                disabled={importing}
                className="hidden"
              />
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block">
                {importing ? 'Importing...' : 'Select CSV File'}
              </span>
            </label>

            <div className="mt-8 pt-8 border-t">
              <p className="text-sm text-gray-600 mb-3 font-semibold">CSV Format Requirements:</p>
              <ul className="text-sm text-gray-600 space-y-2 text-left max-w-sm mx-auto">
                <li>• Column headers: id, stem, optionA, optionB, optionC, optionD, correctAnswer, explanation, domain</li>
                <li>• Correct answer must be: A, B, C, or D</li>
                <li>• UTF-8 encoding</li>
                <li>• Example: <code className="bg-gray-200 px-2 py-1 rounded text-xs">1,What is 2+2?,3,4,5,6,B,The sum of 2 and 2 is 4,Math</code></li>
              </ul>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg p-6 ${
            result && error === null ? 'bg-green-50 border-2 border-correct' : 'bg-orange-50 border-2 border-warning'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {result && error === null ? (
                <>
                  <CheckCircle className="w-6 h-6 text-correct" />
                  <h3 className="text-xl font-bold text-correct">Import Successful!</h3>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-warning" />
                  <h3 className="text-xl font-bold text-warning">Import Completed with Errors</h3>
                </>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-gray-800">
                <strong>{result?.questionsImported}</strong> questions imported successfully
              </p>
              {result && result.questionsSkipped > 0 && (
                <p className="text-gray-800">
                  <strong>{result.questionsSkipped}</strong> rows skipped due to errors
                </p>
              )}
            </div>

            {parseErrors && parseErrors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Errors:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parseErrors.map((err, idx) => (
                    <div key={idx} className="text-sm bg-white rounded p-3 border border-gray-200">
                      {err.type === 'missingFieldId' && `Row ${err.row}: Missing ID field`}
                      {err.type === 'missingFieldQuestion' && `Row ${err.row}: Missing question stem`}
                      {err.type === 'missingFieldAnswer' && `Row ${err.row}: Missing answer options`}
                      {err.type === 'missingFieldExplanation' && `Row ${err.row}: Missing explanation`}
                      {err.type === 'missingFieldDomain' && `Row ${err.row}: Missing domain`}
                      {err.type === 'invalidAnswerFormat' && `Row ${err.row}: Invalid answer format (expected A/B/C/D, got "${err.value}")`}
                      {err.type === 'malformedRow' && `Row ${err.row}: Malformed row`}
                      {err.type === 'encodingError' && `Encoding error: ${err.details}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  reset();
                  onNavigate('list');
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Start Practicing
              </button>
              <button
                onClick={reset}
                className="flex-1 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Import Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </div>

      {!result && (
        <button
          onClick={onBack}
          className="w-full py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
        >
          Back
        </button>
      )}
    </div>
  );
}
