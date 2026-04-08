import { db } from '../db/database';
import { SavedExamResult, ExamResult, CATResultData } from '../types/index';

export class ExamHistoryService {
  static async saveResult(result: ExamResult, duration: number, catData?: CATResultData): Promise<number> {
    const saved: SavedExamResult = {
      config: result.session.config,
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: result.percentage,
      domainBreakdown: result.domainBreakdown,
      questionResults: result.questionResults,
      completedAt: new Date(),
      duration,
      catData,
    };
    return db.examResults.add(saved) as Promise<number>;
  }

  static async getAllResults(): Promise<SavedExamResult[]> {
    return db.examResults.orderBy('completedAt').reverse().toArray();
  }

}
