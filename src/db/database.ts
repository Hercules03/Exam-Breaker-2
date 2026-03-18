import Dexie, { Table } from 'dexie';
import { Question, UserAnswer, ImportLog, Bookmark } from '../types/index';

export class ExamBreakerDB extends Dexie {
  questions!: Table<Question>;
  userAnswers!: Table<UserAnswer>;
  importLogs!: Table<ImportLog>;
  bookmarks!: Table<Bookmark>;

  constructor() {
    super('ExamBreakerDB');
    this.version(1).stores({
      questions: '++id, domain, domainName',
      userAnswers: '++id, questionId, answeredAt',
      importLogs: '++id, importDate',
      bookmarks: '++id, questionId',
    });
  }
}

export const db = new ExamBreakerDB();
