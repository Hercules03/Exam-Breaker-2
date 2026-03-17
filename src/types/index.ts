export interface Question {
  id: number;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  domain: string;
  createdAt: Date;
}

export interface UserAnswer {
  id: string;
  questionId: number;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  answeredAt: Date;
  attemptNumber: number;
  reviewCount: number;
}

export interface ImportLog {
  id: string;
  importDate: Date;
  fileName: string;
  questionsImported: number;
  questionsSkipped: number;
  errors: ParseError[];
}

export type ParseError = 
  | { type: 'missingFieldQuestion'; row: number }
  | { type: 'missingFieldAnswer'; row: number }
  | { type: 'missingFieldExplanation'; row: number }
  | { type: 'missingFieldDomain'; row: number }
  | { type: 'missingFieldId'; row: number }
  | { type: 'invalidAnswerFormat'; row: number; value: string }
  | { type: 'malformedRow'; row: number }
  | { type: 'encodingError'; details: string };

export interface DomainStats {
  domain: string;
  totalQuestions: number;
  questionsAnswered: number;
  questionsCorrect: number;
  masteryPercentage: number;
  masteryStatus: MasteryStatus;
}

export type MasteryStatus = 'notStarted' | 'needsReview' | 'progressing' | 'mastered';

export interface OverallStats {
  totalQuestions: number;
  questionsAnswered: number;
  questionsCorrect: number;
  averageMasteryPercentage: number;
  domainsStarted: number;
  domainsMastered: number;
}

export type AnswerStatus = 'unanswered' | 'answeredCorrectly' | 'answeredIncorrectly';
