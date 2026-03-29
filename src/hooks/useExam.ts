import { useState, useEffect, useCallback, useRef } from 'react';
import { ExamConfig, ExamSession, ExamResult } from '../types/index';
import { ExamService } from '../services/ExamService';
import { ExamHistoryService } from '../services/ExamHistoryService';

export function useExam() {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = useCallback(async (config: ExamConfig) => {
    setLoading(true);
    try {
      const newSession = await ExamService.createSession(config);
      setSession(newSession);
      setCurrentIndex(0);
      setTimeRemaining(config.timeLimitMinutes * 60);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitExamAnswer = useCallback((questionId: number, answer: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: { ...prev.answers, [questionId]: answer },
      };
    });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const finishExam = useCallback(async () => {
    if (!session) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setLoading(true);
    try {
      const examResult = await ExamService.completeExam(session);
      const duration = session.config.timeLimitMinutes * 60 - timeRemaining;
      ExamHistoryService.saveResult(examResult, duration).catch(() => {});
      setResult(examResult);
    } finally {
      setLoading(false);
    }
  }, [session, timeRemaining]);

  const saveToProgress = useCallback(async () => {
    if (!session) return;
    await ExamService.saveAnswersToProgress(session);
  }, [session]);

  const resetExam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSession(null);
    setCurrentIndex(0);
    setTimeRemaining(0);
    setResult(null);
  }, []);

  // Timer
  useEffect(() => {
    if (!session || result) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto finish
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session, result, finishExam]);

  return {
    session,
    currentIndex,
    timeRemaining,
    result,
    loading,
    startExam,
    submitExamAnswer,
    goToQuestion,
    finishExam,
    saveToProgress,
    resetExam,
  };
}
