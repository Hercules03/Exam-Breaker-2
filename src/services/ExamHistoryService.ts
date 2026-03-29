import { db } from '../db/database';
import { SavedExamResult, ExamResult } from '../types/index';

export class ExamHistoryService {
  static async saveResult(result: ExamResult, duration: number): Promise<number> {
    const saved: SavedExamResult = {
      config: result.session.config,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      domainBreakdown: result.domainBreakdown,
      questionResults: result.questionResults,
      completedAt: new Date(),
      duration,
    };
    return db.examResults.add(saved) as Promise<number>;
  }

  static async getAllResults(): Promise<SavedExamResult[]> {
    return db.examResults.orderBy('completedAt').reverse().toArray();
  }

  static async getResultById(id: number): Promise<SavedExamResult | undefined> {
    return db.examResults.get(id);
  }

  static async deleteResult(id: number): Promise<void> {
    await db.examResults.delete(id);
  }

  static async clearAll(): Promise<void> {
    await db.examResults.clear();
  }
}
