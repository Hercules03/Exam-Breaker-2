import { useState, useCallback } from 'react';
import { ParseError } from '../types/index';
import { ImportService } from '../services/ImportService';

export function useImportCSV() {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [result, setResult] = useState<{
    questionsImported: number;
    questionsSkipped: number;
  } | null>(null);

  const importFromFile = useCallback(async (file: File) => {
    try {
      setImporting(true);
      setError(null);
      setParseErrors([]);
      setResult(null);

      const importResult = await ImportService.importFromFile(file);

      if (importResult.errors.length > 0) {
        setParseErrors(importResult.errors);
      }

      setResult({
        questionsImported: importResult.questionsImported,
        questionsSkipped: importResult.questionsSkipped,
      });

      return importResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import CSV';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setImporting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setParseErrors([]);
    setResult(null);
  }, []);

  return {
    importFromFile,
    importing,
    error,
    parseErrors,
    result,
    reset,
  };
}
