import { db } from '../db/database';

export class FlagService {
  static async toggleFlag(questionId: number, context: string): Promise<boolean> {
    const existing = await db.questionFlags
      .where({ questionId, context })
      .first();
    if (existing) {
      await db.questionFlags.delete(existing.id!);
      return false;
    } else {
      await db.questionFlags.add({ questionId, context, createdAt: new Date() });
      return true;
    }
  }

  static async isFlagged(questionId: number, context: string): Promise<boolean> {
    const count = await db.questionFlags.where({ questionId, context }).count();
    return count > 0;
  }

  static async getFlaggedIds(context: string): Promise<Set<number>> {
    const flags = await db.questionFlags.where('context').equals(context).toArray();
    return new Set(flags.map((f) => f.questionId));
  }

}
