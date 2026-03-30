import { useState, useEffect, useCallback, useRef } from 'react';
import { ExamConfig, ExamResult, CATResultData, Question } from '../types/index';
import { ExamService, CATSessionData } from '../services/ExamService';
import { ExamHistoryService } from '../services/ExamHistoryService';
import { QuestionService } from '../services/QuestionService';

export function useExam() {
  const [data, setData] = useState<CATSessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [result, setResult] = useState<(ExamResult & { catData: CATResultData }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef = useRef<CATSessionData | null>(null);

  // Keep ref in sync for timer callback access
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const loadQuestion = useCallback(async (questionId: number) => {
    const q = await QuestionService.getQuestion(questionId);
    setCurrentQuestion(q || null);
    setSelectedAnswer(null);
  }, []);

  const startExam = useCallback(async (config: ExamConfig) => {
    setLoading(true);
    try {
      const sessionData = await ExamService.createSession(config);
      setData(sessionData);
      setTimeRemaining(config.timeLimitMinutes * 60);
      setResult(null);
      await loadQuestion(sessionData.currentQuestionId);
    } finally {
      setLoading(false);
    }
  }, [loadQuestion]);

  const finishExam = useCallback(async (reason: 'confidence' | 'maxQuestions' | 'timeUp' = 'timeUp') => {
    const current = dataRef.current;
    if (!current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setLoading(true);
    try {
      const examResult = await ExamService.completeExam(current, reason);
      const duration = current.session.config.timeLimitMinutes * 60 - timeRemaining;
      ExamHistoryService.saveResult(examResult, duration, examResult.catData).catch(() => {});
      setResult(examResult);
    } finally {
      setLoading(false);
    }
  }, [timeRemaining]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!data || !currentQuestion) return;

    const { data: newData, terminated } = ExamService.processAnswer(
      data,
      currentQuestion.id,
      answer,
      currentQuestion
    );

    setData(newData);

    if (terminated) {
      // Use the ref to get the latest data for finishing
      dataRef.current = newData;
      await finishExam(newData.catState.terminationReason || 'confidence');
    } else {
      await loadQuestion(newData.currentQuestionId);
    }
  }, [data, currentQuestion, finishExam, loadQuestion]);

  const saveToProgress = useCallback(async () => {
    if (!data) return;
    await ExamService.saveAnswersToProgress(data.session);
  }, [data]);

  const resetExam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setData(null);
    setCurrentQuestion(null);
    setTimeRemaining(0);
    setResult(null);
    setSelectedAnswer(null);
  }, []);

  // Timer
  useEffect(() => {
    if (!data || result) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishExam('timeUp');
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
  }, [data, result, finishExam]);

  return {
    session: data?.session ?? null,
    catState: data?.catState ?? null,
    currentQuestion,
    timeRemaining,
    result,
    loading,
    selectedAnswer,
    setSelectedAnswer,
    startExam,
    submitAnswer,
    finishExam,
    saveToProgress,
    resetExam,
    questionsAnswered: data?.catState.responses.length ?? 0,
    minQuestions: data?.session.config.minQuestions ?? 0,
    maxQuestions: data?.session.config.maxQuestions ?? 0,
  };
}
