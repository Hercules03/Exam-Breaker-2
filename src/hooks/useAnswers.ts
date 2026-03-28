import React, { useState, useCallback } from 'react';
import { UserAnswer, AnswerStatus } from '../types/index';
import { AnswerService } from '../services/AnswerService';

export function useSubmitAnswer() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAnswer = useCallback(
    async (questionId: number, selectedAnswer: string) => {
      try {
        setSubmitting(true);
        setError(null);
        const result = await AnswerService.submitAnswer(questionId, selectedAnswer);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit answer';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitAnswer, submitting, error };
}

export function useAnswerHistory(questionId: number) {
  const [history, setHistory] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnswerService.getAnswerHistory(questionId);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load answer history');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  // Load on mount
  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return { history, loading, error, refresh: loadHistory };
}

export function useAnswerStatus(questionId: number) {
  const [status, setStatus] = useState<AnswerStatus>('unanswered');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnswerService.getAnswerStatus(questionId);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load answer status');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  // Load on mount
  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  return { status, loading, error, refresh: loadStatus };
}
