import { ExamConfig, ExamSession, ExamResult } from '../types/index';
import { QuestionService } from './QuestionService';
import { AnswerService } from './AnswerService';

export class ExamService {
  static async createSession(config: ExamConfig): Promise<ExamSession> {
    let questions = await QuestionService.getAllQuestions();

    if (config.domain) {
      questions = questions.filter((q) => q.domain === config.domain);
    }

    // Shuffle and take requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(config.questionCount, shuffled.length));

    return {
      id: `exam-${Date.now()}`,
      config,
      questionIds: selected.map((q) => q.id),
      answers: {},
      startedAt: new Date(),
    };
  }

  static async completeExam(session: ExamSession): Promise<ExamResult> {
    const questionResults: ExamResult['questionResults'] = [];
    const domainMap = new Map<string, { domain: string; domainName: string; correct: number; total: number }>();

    for (const questionId of session.questionIds) {
      const question = await QuestionService.getQuestion(questionId);
      if (!question) continue;

      const selectedAnswer = session.answers[questionId] || '';
      const correctAnswers = question.correctAnswer.split(',');
      const isCorrect = correctAnswers.includes(selectedAnswer);

      questionResults.push({
        questionId,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });

      const key = question.domain;
      if (!domainMap.has(key)) {
        domainMap.set(key, { domain: question.domain, domainName: question.domainName || question.domain, correct: 0, total: 0 });
      }
      const entry = domainMap.get(key)!;
      entry.total++;
      if (isCorrect) entry.correct++;
    }

    const score = questionResults.filter((r) => r.isCorrect).length;

    return {
      session: { ...session, completedAt: new Date() },
      score,
      totalQuestions: session.questionIds.length,
      percentage: session.questionIds.length > 0 ? Math.round((score / session.questionIds.length) * 100) : 0,
      domainBreakdown: Array.from(domainMap.values()).sort((a, b) => a.domain.localeCompare(b.domain)),
      questionResults,
    };
  }

  static async saveAnswersToProgress(session: ExamSession): Promise<void> {
    for (const questionId of session.questionIds) {
      const selectedAnswer = session.answers[questionId];
      if (selectedAnswer) {
        await AnswerService.submitAnswer(questionId, selectedAnswer);
      }
    }
  }
}
