import { useState, useEffect, useCallback } from 'react';
import { SavedExamResult } from '../types/index';
import { ExamHistoryService } from '../services/ExamHistoryService';

export function useExamHistory() {
  const [results, setResults] = useState<SavedExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await ExamHistoryService.getAllResults();
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { results, loading, refresh };
}
