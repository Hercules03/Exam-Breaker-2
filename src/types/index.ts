export interface Question {
  id: number;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // Single "A" or multiple "A,B,D"
  domain: string;
  domainName: string;
  simplified: string;
  whyCorrect: string;
  whyIncorrect: string;
  keywords: string;
  fullQuestion: string;
  createdAt: Date;
}

export interface UserAnswer {
  id: string;
  questionId: number;
  selectedAnswer: string; // Single "A" or multiple "A,B" for multi-answer questions
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
  | { type: 'missingFieldDomain'; row: number }
  | { type: 'missingFieldId'; row: number }
  | { type: 'invalidAnswerFormat'; row: number; value: string }
  | { type: 'malformedRow'; row: number }
  | { type: 'encodingError'; details: string };

export interface DomainStats {
  domain: string;
  domainName: string;
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

export interface Bookmark {
  id?: number;
  questionId: number;
  createdAt: Date;
}

export interface ExamConfig {
  timeLimitMinutes: number;
  minQuestions: number;
  maxQuestions: number;
  domain?: string;
}

export interface QuestionDifficulty {
  questionId: number;
  difficulty: number; // 0.0 (easy) to 1.0 (hard)
  totalAttempts: number;
}

export interface CATState {
  abilityEstimate: number; // theta on logit scale, starts at 0
  standardError: number; // starts at 1.0, decreases with answers
  answeredQuestionIds: number[];
  responses: CATResponse[];
  terminated: boolean;
  terminationReason?: 'confidence' | 'maxQuestions' | 'timeUp';
}

export interface CATResponse {
  questionId: number;
  difficulty: number;
  isCorrect: boolean;
  abilityAfter: number;
  standardErrorAfter: number;
}

export interface CATResultData {
  finalAbility: number;
  finalStandardError: number;
  scaledScore: number; // 0-1000
  passed: boolean; // scaledScore >= 700
  questionsAttempted: number;
  maxQuestions: number;
  terminationReason: 'confidence' | 'maxQuestions' | 'timeUp';
  abilityHistory: { questionNumber: number; ability: number; se: number }[];
}

export interface ExamSession {
  id: string;
  config: ExamConfig;
  questionIds: number[];
  answers: { [questionId: number]: string }; // Single "A" or multiple "A,B"
  startedAt: Date;
  completedAt?: Date;
}

export interface ExamResult {
  session: ExamSession;
  score: number;
  totalQuestions: number;
  percentage: number;
  domainBreakdown: { domain: string; domainName: string; correct: number; total: number }[];
  questionResults: { questionId: number; selectedAnswer: string; correctAnswer: string; isCorrect: boolean }[];
}

export interface SavedExamResult {
  id?: number;
  config: ExamConfig;
  score: number;
  totalQuestions: number;
  percentage: number;
  domainBreakdown: { domain: string; domainName: string; correct: number; total: number }[];
  questionResults: { questionId: number; selectedAnswer: string; correctAnswer: string; isCorrect: boolean }[];
  completedAt: Date;
  duration: number;
  catData?: CATResultData;
}

export interface StudyActivity {
  id?: number;
  date: string;
  questionsStudied: number;
  questionsCorrect: number;
}

export interface QuestionNote {
  id?: number;
  questionId: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionFlag {
  id?: number;
  questionId: number;
  context: string;
  createdAt: Date;
}

export interface StudySessionConfig {
  mode: 'weakArea' | 'domain' | 'shuffle' | 'incorrect';
  questionIds: number[];
  domain?: string;
  label: string;
}
