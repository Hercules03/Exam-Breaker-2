import { db } from '../db/database';
import { Question, QuestionDifficulty, CATState, CATResponse, ExamConfig } from '../types/index';

export class CATService {
  /**
   * Compute difficulty for each question from historical answer data.
   * difficulty = incorrectAttempts / totalAttempts. Default 0.5 for unseen questions.
   */
  static async computeDifficultyMap(): Promise<Map<number, QuestionDifficulty>> {
    const allAnswers = await db.userAnswers.toArray();
    const statsMap = new Map<number, { incorrect: number; total: number }>();

    for (const answer of allAnswers) {
      const stats = statsMap.get(answer.questionId) || { incorrect: 0, total: 0 };
      stats.total++;
      if (!answer.isCorrect) stats.incorrect++;
      statsMap.set(answer.questionId, stats);
    }

    const difficultyMap = new Map<number, QuestionDifficulty>();
    for (const [questionId, stats] of statsMap) {
      difficultyMap.set(questionId, {
        questionId,
        difficulty: stats.total > 0 ? stats.incorrect / stats.total : 0.5,
        totalAttempts: stats.total,
      });
    }

    return difficultyMap;
  }

  /**
   * Get difficulty for a question, defaulting to 0.5 if no history.
   * Maps the 0-1 error rate to a logit-scale difficulty for IRT.
   * 0.5 error rate -> 0.0 logit, 0.9 -> +2.2, 0.1 -> -2.2
   */
  static getDifficulty(questionId: number, difficultyMap: Map<number, QuestionDifficulty>): number {
    const entry = difficultyMap.get(questionId);
    const errorRate = entry ? entry.difficulty : 0.5;
    // Clamp to avoid infinities in logit transform
    const clamped = Math.max(0.05, Math.min(0.95, errorRate));
    // Convert error rate to logit scale: log(p / (1-p))
    return Math.log(clamped / (1 - clamped));
  }

  /**
   * Select the next question whose difficulty is closest to current ability estimate.
   * This targets ~50% probability of correct answer per IRT 1PL model.
   */
  static selectNextQuestion(
    catState: CATState,
    difficultyMap: Map<number, QuestionDifficulty>,
    availablePool: Question[]
  ): number | null {
    const answeredSet = new Set(catState.answeredQuestionIds);
    const remaining = availablePool.filter((q) => !answeredSet.has(q.id));

    if (remaining.length === 0) return null;

    const theta = catState.abilityEstimate;
    let bestId = remaining[0].id;
    let bestDiff = Infinity;

    for (const q of remaining) {
      const difficulty = CATService.getDifficulty(q.id, difficultyMap);
      const diff = Math.abs(difficulty - theta);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestId = q.id;
      }
    }

    return bestId;
  }

  /**
   * Update ability estimate using Newton-Raphson MLE on 1PL IRT model.
   * After each response, recompute theta from all scored responses.
   */
  static updateAbility(responses: CATResponse[]): { ability: number; standardError: number } {
    if (responses.length === 0) {
      return { ability: 0, standardError: 1.0 };
    }

    // Newton-Raphson MLE for 1PL model
    let theta = 0;
    const maxIter = 20;
    const tolerance = 0.001;

    for (let iter = 0; iter < maxIter; iter++) {
      let logLikeDeriv = 0; // first derivative of log-likelihood
      let logLikeDeriv2 = 0; // second derivative (negative Fisher information)

      for (const r of responses) {
        const p = 1 / (1 + Math.exp(-(theta - r.difficulty)));
        const residual = (r.isCorrect ? 1 : 0) - p;
        logLikeDeriv += residual;
        logLikeDeriv2 -= p * (1 - p);
      }

      // Add a small prior to prevent divergence (Bayesian regularization)
      // N(0, 2) prior: derivative = -theta/4, second derivative = -1/4
      logLikeDeriv -= theta / 4;
      logLikeDeriv2 -= 1 / 4;

      if (Math.abs(logLikeDeriv2) < 1e-10) break;

      const step = logLikeDeriv / logLikeDeriv2;
      theta -= step;

      // Clamp theta to reasonable range
      theta = Math.max(-4, Math.min(4, theta));

      if (Math.abs(step) < tolerance) break;
    }

    // Standard error = 1 / sqrt(Fisher information)
    let fisherInfo = 0;
    for (const r of responses) {
      const p = 1 / (1 + Math.exp(-(theta - r.difficulty)));
      fisherInfo += p * (1 - p);
    }
    // Add prior contribution
    fisherInfo += 1 / 4;

    const se = fisherInfo > 0 ? 1 / Math.sqrt(fisherInfo) : 1.0;

    return { ability: theta, standardError: se };
  }

  /**
   * Check if the CAT exam should terminate.
   */
  static shouldTerminate(
    catState: CATState,
    config: ExamConfig
  ): { terminate: boolean; reason?: 'confidence' | 'maxQuestions' } {
    const answered = catState.responses.length;

    // Always stop at max questions
    if (answered >= config.maxQuestions) {
      return { terminate: true, reason: 'maxQuestions' };
    }

    // Only consider early termination after minimum questions
    if (answered >= config.minQuestions) {
      // Terminate if standard error is low enough to be confident
      if (catState.standardError < 0.30) {
        return { terminate: true, reason: 'confidence' };
      }

      // Also terminate if ability is clearly above or below passing
      const passingTheta = CATService.scaledScoreToTheta(700);
      const distance = Math.abs(catState.abilityEstimate - passingTheta);
      // If we're more than 2 SEs away from the passing line, we're confident
      if (distance > 2 * catState.standardError) {
        return { terminate: true, reason: 'confidence' };
      }
    }

    return { terminate: false };
  }

  /**
   * Map theta (logit scale) to a 0-1000 scaled score.
   * Mapping: theta -3 -> 200, theta 0 -> 500, theta +3 -> 800
   * Linear: score = 500 + (theta * 100)
   * Clamped to [0, 1000]
   */
  static computeScaledScore(ability: number): number {
    const score = 500 + ability * 100;
    return Math.round(Math.max(0, Math.min(1000, score)));
  }

  /**
   * Reverse mapping: scaled score to theta.
   */
  static scaledScoreToTheta(score: number): number {
    return (score - 500) / 100;
  }

  /**
   * Initialize a fresh CAT state.
   */
  static createInitialState(): CATState {
    return {
      abilityEstimate: 0,
      standardError: 1.0,
      answeredQuestionIds: [],
      responses: [],
      terminated: false,
    };
  }

  /**
   * Process an answer: update ability, check termination, return updated state.
   */
  static processAnswer(
    catState: CATState,
    questionId: number,
    difficulty: number,
    isCorrect: boolean,
    config: ExamConfig
  ): CATState {
    const response: CATResponse = {
      questionId,
      difficulty,
      isCorrect,
      abilityAfter: 0, // will be updated
      standardErrorAfter: 0, // will be updated
    };

    const newResponses = [...catState.responses, response];
    const { ability, standardError } = CATService.updateAbility(newResponses);

    // Update the last response with post-update values
    response.abilityAfter = ability;
    response.standardErrorAfter = standardError;

    const newState: CATState = {
      ...catState,
      abilityEstimate: ability,
      standardError,
      answeredQuestionIds: [...catState.answeredQuestionIds, questionId],
      responses: newResponses,
      terminated: false,
    };

    // Check termination
    const { terminate, reason } = CATService.shouldTerminate(newState, config);
    if (terminate) {
      newState.terminated = true;
      newState.terminationReason = reason;
    }

    return newState;
  }
}
