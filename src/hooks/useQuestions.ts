import { useState, useEffect } from 'react';
import { Question, AnswerStatus } from '../types/index';
import { QuestionService } from '../services/QuestionService';

export function useQuestions(domain?: string, answerStatus?: AnswerStatus) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await QuestionService.getFilteredQuestions(domain, answerStatus);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [domain, answerStatus]);

  return { questions, loading, error };
}

export function useQuestion(questionId: number) {
  const [question, setQuestion] = useState<Question | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestion = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await QuestionService.getQuestion(questionId);
        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId]);

  return { question, loading, error };
}

export function useDomains() {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await QuestionService.getAllDomains();
        setDomains(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domains');
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, []);

  return { domains, loading, error };
}
