import { UserAnswer, AnswerStatus } from '../types/index';
import { db } from '../db/database';
import { QuestionService } from './QuestionService';

export class AnswerService {
  /**
   * Submit an answer and track it
   */
  static async submitAnswer(
    questionId: number,
    selectedAnswer: 'A' | 'B' | 'C' | 'D'
  ): Promise<{ isCorrect: boolean; userAnswerId: string }> {
    const question = await QuestionService.getQuestion(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    const isCorrect = selectedAnswer === question.correctAnswer;

    // Get attempt number
    const previousAnswers = await this.getAnswerHistory(questionId);
    const attemptNumber = previousAnswers.length + 1;

    // Create user answer
    const userAnswer: UserAnswer = {
      id: `${questionId}-${Date.now()}`,
      questionId,
      selectedAnswer,
      isCorrect,
      answeredAt: new Date(),
      attemptNumber,
      reviewCount: 0,
    };

    await db.userAnswers.add(userAnswer);

    return { isCorrect, userAnswerId: userAnswer.id };
  }

  /**
   * Get answer history for a question
   */
  static async getAnswerHistory(questionId: number): Promise<UserAnswer[]> {
    return db.userAnswers
      .where('questionId')
      .equals(questionId)
      .toArray()
      .then((answers) => answers.sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime()));
  }

  /**
   * Get latest answer for a question
   */
  static async getLatestAnswer(questionId: number): Promise<UserAnswer | undefined> {
    const history = await this.getAnswerHistory(questionId);
    return history.length > 0 ? history[history.length - 1] : undefined;
  }

  /**
   * Get answer status for all questions
   */
  static async getAnswerStatusMap(): Promise<{ [questionId: number]: AnswerStatus }> {
    const allAnswers = await db.userAnswers.toArray();
    const statusMap: { [questionId: number]: AnswerStatus } = {};

    for (const answer of allAnswers) {
      // Skip if we already have a status for this question
      if (statusMap[answer.questionId]) continue;

      // Determine status based on latest answer
      const latestAnswer = await this.getLatestAnswer(answer.questionId);
      if (!latestAnswer) continue;

      statusMap[answer.questionId] = latestAnswer.isCorrect
        ? 'answeredCorrectly'
        : 'answeredIncorrectly';
    }

    return statusMap;
  }

  /**
   * Get answer status for a specific question
   */
  static async getAnswerStatus(questionId: number): Promise<AnswerStatus> {
    const latestAnswer = await this.getLatestAnswer(questionId);
    if (!latestAnswer) return 'unanswered';
    return latestAnswer.isCorrect ? 'answeredCorrectly' : 'answeredIncorrectly';
  }

  /**
   * Mark an answer as reviewed (increment review count)
   */
  static async markAnswerReviewed(userAnswerId: string): Promise<void> {
    const userAnswer = await db.userAnswers.get(userAnswerId);
    if (userAnswer) {
      await db.userAnswers.update(userAnswerId, {
        reviewCount: userAnswer.reviewCount + 1,
      });
    }
  }

  /**
   * Get total answered questions count
   */
  static async getTotalAnsweredCount(): Promise<number> {
    const allAnswers = await db.userAnswers.toArray();
    const uniqueQuestionIds = new Set(allAnswers.map((a) => a.questionId));
    return uniqueQuestionIds.size;
  }

  /**
   * Get correct answers count
   */
  static async getCorrectAnswersCount(): Promise<number> {
    const allAnswers = await db.userAnswers.toArray();
    const correctQuestions = new Set<number>();

    for (const answer of allAnswers) {
      const latestAnswer = await this.getLatestAnswer(answer.questionId);
      if (latestAnswer?.isCorrect) {
        correctQuestions.add(answer.questionId);
      }
    }

    return correctQuestions.size;
  }

  /**
   * Get answers for a domain
   */
  static async getAnswersForDomain(domain: string): Promise<UserAnswer[]> {
    const questions = await db.questions.where('domain').equals(domain).toArray();
    const questionIds = new Set(questions.map((q) => q.id));

    const allAnswers = await db.userAnswers.toArray();
    return allAnswers.filter((a) => questionIds.has(a.questionId));
  }

  /**
   * Clear answers for a specific question
   */
  static async clearAnswersForQuestion(questionId: number): Promise<void> {
    await db.userAnswers.where('questionId').equals(questionId).delete();
  }

  /**
   * Clear all answers
   */
  static async clearAllAnswers(): Promise<void> {
    await db.userAnswers.clear();
  }

  /**
   * Get answer stats for a specific question
   */
  static async getQuestionAnswerStats(
    questionId: number
  ): Promise<{
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    isCorrect: boolean;
    lastAnsweredAt?: Date;
  }> {
    const history = await this.getAnswerHistory(questionId);
    const correctAttempts = history.filter((a) => a.isCorrect).length;
    const incorrectAttempts = history.filter((a) => !a.isCorrect).length;
    const lastAnswer = history.length > 0 ? history[history.length - 1] : undefined;

    return {
      totalAttempts: history.length,
      correctAttempts,
      incorrectAttempts,
      isCorrect: lastAnswer?.isCorrect ?? false,
      lastAnsweredAt: lastAnswer?.answeredAt,
    };
  }
}
