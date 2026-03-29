import { db } from '../db/database';
import { StudyActivity } from '../types/index';

const DAILY_GOAL_KEY = 'examBreaker_dailyGoal';

export class StudyActivityService {
  static getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  static async recordActivity(correct: boolean): Promise<void> {
    const date = this.getTodayDateString();
    const existing = await db.studyActivity.where('date').equals(date).first();
    if (existing) {
      await db.studyActivity.update(existing.id!, {
        questionsStudied: existing.questionsStudied + 1,
        questionsCorrect: existing.questionsCorrect + (correct ? 1 : 0),
      });
    } else {
      await db.studyActivity.add({
        date,
        questionsStudied: 1,
        questionsCorrect: correct ? 1 : 0,
      });
    }
  }

  static async getToday(): Promise<StudyActivity | undefined> {
    const date = this.getTodayDateString();
    return db.studyActivity.where('date').equals(date).first();
  }

  static async getStreak(): Promise<number> {
    const all = await db.studyActivity.orderBy('date').reverse().toArray();
    if (all.length === 0) return 0;

    const today = this.getTodayDateString();
    let streak = 0;
    const checkDate = new Date(today);

    // If no activity today, start checking from yesterday
    if (all[0].date !== today) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const found = all.find((a) => a.date === dateStr);
      if (found && found.questionsStudied > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  static async getHistory(days: number): Promise<StudyActivity[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return db.studyActivity.where('date').aboveOrEqual(cutoffStr).sortBy('date');
  }

  static getDailyGoal(): number {
    const stored = localStorage.getItem(DAILY_GOAL_KEY);
    return stored ? parseInt(stored, 10) : 20;
  }

  static setDailyGoal(target: number): void {
    localStorage.setItem(DAILY_GOAL_KEY, String(target));
  }
}
