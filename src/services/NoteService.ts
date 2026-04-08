import { db } from '../db/database';
import { QuestionNote } from '../types/index';

export class NoteService {
  static async getNote(questionId: number): Promise<QuestionNote | undefined> {
    return db.questionNotes.where('questionId').equals(questionId).first();
  }

  static async saveNote(questionId: number, text: string): Promise<void> {
    const existing = await this.getNote(questionId);
    if (existing) {
      await db.questionNotes.update(existing.id!, { text, updatedAt: new Date() });
    } else {
      await db.questionNotes.add({
        questionId,
        text,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  static async deleteNote(questionId: number): Promise<void> {
    await db.questionNotes.where('questionId').equals(questionId).delete();
  }

}
