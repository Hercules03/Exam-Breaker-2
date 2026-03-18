import { db } from '../db/database';

export class BookmarkService {
  static async toggle(questionId: number): Promise<boolean> {
    const existing = await db.bookmarks.where('questionId').equals(questionId).first();
    if (existing) {
      await db.bookmarks.delete(existing.id!);
      return false;
    } else {
      await db.bookmarks.add({ questionId, createdAt: new Date() });
      return true;
    }
  }

  static async isBookmarked(questionId: number): Promise<boolean> {
    const count = await db.bookmarks.where('questionId').equals(questionId).count();
    return count > 0;
  }

  static async getBookmarkedQuestionIds(): Promise<Set<number>> {
    const bookmarks = await db.bookmarks.toArray();
    return new Set(bookmarks.map((b) => b.questionId));
  }

  static async clearAll(): Promise<void> {
    await db.bookmarks.clear();
  }
}
