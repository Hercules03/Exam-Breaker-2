import { Question, UserAnswer } from '../types/index';
import { db } from '../db/database';

export class SpacedRepetitionService {
  /**
   * Get a weighted random question. Weights:
   * - Unanswered: 10
   * - Last answer incorrect: 8
   * - Last answer correct: linear by days since (max 7)
   */
  static async getWeightedRandomQuestion(questions: Question[]): Promise<Question | undefined> {
    if (questions.length === 0) return undefined;

    // Build a map of questionId -> latest answer in one query
    const allAnswers = await db.userAnswers.toArray();
    const latestAnswerMap = new Map<number, UserAnswer>();

    for (const answer of allAnswers) {
      const existing = latestAnswerMap.get(answer.questionId);
      if (!existing || answer.answeredAt > existing.answeredAt) {
        latestAnswerMap.set(answer.questionId, answer);
      }
    }

    const now = Date.now();
    const weights: number[] = [];

    for (const question of questions) {
      const latest = latestAnswerMap.get(question.id);
      if (!latest) {
        weights.push(10);
      } else if (!latest.isCorrect) {
        weights.push(8);
      } else {
        const daysSince = (now - new Date(latest.answeredAt).getTime()) / (1000 * 60 * 60 * 24);
        weights.push(Math.min(daysSince, 7));
      }
    }

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) {
      // All weights are 0 (all answered correctly very recently), fall back to uniform random
      return questions[Math.floor(Math.random() * questions.length)];
    }

    let random = Math.random() * totalWeight;
    for (let i = 0; i < questions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return questions[i];
      }
    }

    return questions[questions.length - 1];
  }
}
