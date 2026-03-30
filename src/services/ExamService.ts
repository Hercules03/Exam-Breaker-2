import { ExamConfig, ExamSession, ExamResult, CATState, CATResultData, QuestionDifficulty, Question } from '../types/index';
import { QuestionService } from './QuestionService';
import { AnswerService } from './AnswerService';
import { CATService } from './CATService';

export interface CATSessionData {
  session: ExamSession;
  catState: CATState;
  difficultyMap: Map<number, QuestionDifficulty>;
  questionPool: Question[];
  currentQuestionId: number;
}

export class ExamService {
  /**
   * Create a new CAT exam session. Loads questions, computes difficulty,
   * and selects only the first question adaptively.
   */
  static async createSession(config: ExamConfig): Promise<CATSessionData> {
    let questions = await QuestionService.getAllQuestions();

    if (config.domain) {
      questions = questions.filter((q) => q.domain === config.domain);
    }

    const difficultyMap = await CATService.computeDifficultyMap();
    const catState = CATService.createInitialState();

    // Select the first question (medium difficulty, closest to theta=0)
    const firstQuestionId = CATService.selectNextQuestion(catState, difficultyMap, questions);

    if (!firstQuestionId) {
      throw new Error('No questions available for this configuration.');
    }

    const session: ExamSession = {
      id: `cat-${Date.now()}`,
      config,
      questionIds: [firstQuestionId],
      answers: {},
      startedAt: new Date(),
    };

    return {
      session,
      catState,
      difficultyMap,
      questionPool: questions,
      currentQuestionId: firstQuestionId,
    };
  }

  /**
   * Process an answer in the CAT session. Updates ability, selects next question or terminates.
   */
  static processAnswer(
    data: CATSessionData,
    questionId: number,
    selectedAnswer: string,
    question: Question
  ): { data: CATSessionData; isCorrect: boolean; terminated: boolean } {
    const correctAnswers = question.correctAnswer.split(',').sort();
    const userAnswers = selectedAnswer ? selectedAnswer.split(',').sort() : [];
    const isCorrect =
      correctAnswers.length === userAnswers.length &&
      correctAnswers.every((a, i) => a === userAnswers[i]);

    const difficulty = CATService.getDifficulty(questionId, data.difficultyMap);
    const newCatState = CATService.processAnswer(data.catState, questionId, difficulty, isCorrect, data.session.config);

    const newSession: ExamSession = {
      ...data.session,
      answers: { ...data.session.answers, [questionId]: selectedAnswer },
    };

    let nextQuestionId = data.currentQuestionId;

    if (!newCatState.terminated) {
      const nextId = CATService.selectNextQuestion(newCatState, data.difficultyMap, data.questionPool);
      if (nextId) {
        nextQuestionId = nextId;
        newSession.questionIds = [...newSession.questionIds, nextId];
      } else {
        // No more questions available
        newCatState.terminated = true;
        newCatState.terminationReason = 'maxQuestions';
      }
    }

    return {
      data: {
        ...data,
        session: newSession,
        catState: newCatState,
        currentQuestionId: nextQuestionId,
      },
      isCorrect,
      terminated: newCatState.terminated,
    };
  }

  /**
   * Complete the exam and produce results with CAT-specific data.
   */
  static async completeExam(data: CATSessionData, terminationReason: 'confidence' | 'maxQuestions' | 'timeUp'): Promise<ExamResult & { catData: CATResultData }> {
    const { session, catState } = data;
    const questionResults: ExamResult['questionResults'] = [];
    const domainMap = new Map<string, { domain: string; domainName: string; correct: number; total: number }>();

    for (const questionId of session.questionIds) {
      const question = await QuestionService.getQuestion(questionId);
      if (!question) continue;

      const selectedAnswer = session.answers[questionId] || '';
      const correctAnswers = question.correctAnswer.split(',').sort();
      const userAnswers = selectedAnswer ? selectedAnswer.split(',').sort() : [];
      const isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((a, i) => a === userAnswers[i]);

      questionResults.push({ questionId, selectedAnswer, correctAnswer: question.correctAnswer, isCorrect });

      const key = question.domain;
      if (!domainMap.has(key)) {
        domainMap.set(key, { domain: question.domain, domainName: question.domainName || question.domain, correct: 0, total: 0 });
      }
      const entry = domainMap.get(key)!;
      entry.total++;
      if (isCorrect) entry.correct++;
    }

    const score = questionResults.filter((r) => r.isCorrect).length;
    const scaledScore = CATService.computeScaledScore(catState.abilityEstimate);

    const catData: CATResultData = {
      finalAbility: catState.abilityEstimate,
      finalStandardError: catState.standardError,
      scaledScore,
      passed: scaledScore >= 700,
      questionsAttempted: catState.responses.length,
      maxQuestions: session.config.maxQuestions,
      terminationReason,
      abilityHistory: catState.responses.map((r, i) => ({
        questionNumber: i + 1,
        ability: r.abilityAfter,
        se: r.standardErrorAfter,
      })),
    };

    return {
      session: { ...session, completedAt: new Date() },
      score,
      totalQuestions: session.questionIds.length,
      percentage: session.questionIds.length > 0 ? Math.round((score / session.questionIds.length) * 100) : 0,
      domainBreakdown: Array.from(domainMap.values()).sort((a, b) => a.domain.localeCompare(b.domain)),
      questionResults,
      catData,
    };
  }

  static async saveAnswersToProgress(session: ExamSession): Promise<void> {
    for (const questionId of session.questionIds) {
      const selectedAnswer = session.answers[questionId];
      if (selectedAnswer) {
        await AnswerService.submitAnswer(questionId, selectedAnswer);
      }
    }
  }
}
