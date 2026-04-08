import { Question, AnswerStatus } from '../types/index';
import { db } from '../db/database';
import { AnswerService } from './AnswerService';
import { SpacedRepetitionService } from './SpacedRepetitionService';

export class QuestionService {
  /**
   * Get all questions
   */
  static async getAllQuestions(): Promise<Question[]> {
    return db.questions.toArray();
  }

  /**
   * Get question by ID
   */
  static async getQuestion(id: number): Promise<Question | undefined> {
    return db.questions.get(id);
  }

  /**
   * Get all unique domains
   */
  static async getAllDomains(): Promise<string[]> {
    const questions = await this.getAllQuestions();
    const domains = new Set(questions.map((q) => q.domain));
    return Array.from(domains).sort();
  }

  /**
   * Get the domain name for a domain identifier (e.g. "5" -> "Identity and Access Management (IAM)")
   */
  static async getDomainName(domain: string): Promise<string> {
    const question = await db.questions.where('domain').equals(domain).first();
    return question?.domainName || '';
  }

  /**
   * Filter questions by domain and answer status
   */
  static async getFilteredQuestions(
    domain?: string,
    answerStatus?: AnswerStatus
  ): Promise<Question[]> {
    let questions = await this.getAllQuestions();

    // Filter by domain
    if (domain) {
      questions = questions.filter((q) => q.domain === domain);
    }

    // Filter by answer status if specified
    if (answerStatus) {
      const questionIdToStatus = await AnswerService.getAnswerStatusMap();

      questions = questions.filter((q) => {
        const status = questionIdToStatus[q.id] || 'unanswered';
        return status === answerStatus;
      });
    }

    return questions;
  }

  /**
   * Get a random question from filtered set, using spaced repetition weighting
   */
  static async getRandomQuestion(
    domain?: string,
    answerStatus?: AnswerStatus
  ): Promise<Question | undefined> {
    const questions = await this.getFilteredQuestions(domain, answerStatus);
    if (questions.length === 0) return undefined;

    return SpacedRepetitionService.getWeightedRandomQuestion(questions);
  }

  /**
   * Get questions count by domain
   */
  static async getQuestionCountByDomain(domain: string): Promise<number> {
    return db.questions.where('domain').equals(domain).count();
  }

  /**
   * Import questions (replaces existing)
   */
  static async importQuestions(questions: Question[]): Promise<void> {
    // Clear existing questions first
    await db.questions.clear();

    // Wait a moment to ensure clear completes
    await new Promise(resolve => setTimeout(resolve, 100));

    // Import new questions using bulkPut (overwrites duplicates instead of failing)
    await db.questions.bulkPut(questions);
  }

  /**
   * Delete all questions
   */
  static async deleteAllQuestions(): Promise<void> {
    await db.questions.clear();
  }

  /**
   * Get total question count
   */
  static async getTotalQuestionCount(): Promise<number> {
    return db.questions.count();
  }
}
