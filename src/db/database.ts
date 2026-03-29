import Dexie, { Table } from 'dexie';
import { Question, UserAnswer, ImportLog, Bookmark, SavedExamResult, StudyActivity, QuestionNote, QuestionFlag } from '../types/index';

export class ExamBreakerDB extends Dexie {
  questions!: Table<Question>;
  userAnswers!: Table<UserAnswer>;
  importLogs!: Table<ImportLog>;
  bookmarks!: Table<Bookmark>;
  examResults!: Table<SavedExamResult>;
  studyActivity!: Table<StudyActivity>;
  questionNotes!: Table<QuestionNote>;
  questionFlags!: Table<QuestionFlag>;

  constructor() {
    super('ExamBreakerDB');
    this.version(1).stores({
      questions: '++id, domain, domainName',
      userAnswers: '++id, questionId, answeredAt',
      importLogs: '++id, importDate',
      bookmarks: '++id, questionId',
    });
    this.version(2).stores({
      questions: '++id, domain, domainName',
      userAnswers: '++id, questionId, answeredAt',
      importLogs: '++id, importDate',
      bookmarks: '++id, questionId',
      examResults: '++id, completedAt',
      studyActivity: '++id, &date',
      questionNotes: '++id, &questionId',
      questionFlags: '++id, questionId, context',
    });
  }
}

export const db = new ExamBreakerDB();
