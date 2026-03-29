import { useState, useCallback } from 'react';
import { StudySessionConfig } from '../types/index';

interface StudySessionStats {
  total: number;
  answered: number;
  correct: number;
}

export function useStudySession(config: StudySessionConfig) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<StudySessionStats>({
    total: config.questionIds.length,
    answered: 0,
    correct: 0,
  });
  const [completed, setCompleted] = useState(false);

  const currentQuestionId = config.questionIds[currentIndex] ?? null;

  const recordAnswer = useCallback((isCorrect: boolean) => {
    setStats((prev) => ({
      ...prev,
      answered: prev.answered + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex >= config.questionIds.length - 1) {
      setCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, config.questionIds.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setStats({ total: config.questionIds.length, answered: 0, correct: 0 });
    setCompleted(false);
  }, [config.questionIds.length]);

  return {
    currentQuestionId,
    currentIndex,
    total: config.questionIds.length,
    stats,
    completed,
    recordAnswer,
    goNext,
    goPrev,
    reset,
  };
}
