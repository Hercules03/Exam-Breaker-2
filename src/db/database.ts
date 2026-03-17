import Dexie, { Table } from 'dexie';
import { Question, UserAnswer, ImportLog } from '../types/index';

export class ExamBreakerDB extends Dexie {
  questions!: Table<Question>;
  userAnswers!: Table<UserAnswer>;
  importLogs!: Table<ImportLog>;

  constructor() {
    super('ExamBreakerDB');
    this.version(1).stores({
      questions: '++id, domain',
      userAnswers: '++id, questionId, answeredAt',
      importLogs: '++id, importDate',
    });
  }
}

export const db = new ExamBreakerDB();
