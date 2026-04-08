import { DomainStats, MasteryStatus, OverallStats } from '../types/index';
import { QuestionService } from './QuestionService';
import { AnswerService } from './AnswerService';

export class ProgressService {
  /**
   * Calculate mastery percentage (0-100)
   */
  private static calculateMasteryPercentage(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Determine mastery status based on percentage
   */
  private static determineMasteryStatus(percentage: number, totalAnswered: number): MasteryStatus {
    if (totalAnswered === 0) return 'notStarted';
    if (percentage >= 80) return 'mastered';
    if (percentage >= 60) return 'progressing';
    return 'needsReview';
  }

  /**
   * Get stats for a specific domain
   */
  static async getDomainStats(domain: string): Promise<DomainStats> {
    const totalQuestions = await QuestionService.getQuestionCountByDomain(domain);
    const answers = await AnswerService.getAnswersForDomain(domain);
    const domainName = await QuestionService.getDomainName(domain);

    // Count unique questions that have been answered
    const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
    const questionsAnswered = answeredQuestionIds.size;

    // Count correct answers (latest attempt per question)
    let questionsCorrect = 0;
    for (const questionId of answeredQuestionIds) {
      const latestAnswer = await AnswerService.getLatestAnswer(questionId);
      if (latestAnswer?.isCorrect) {
        questionsCorrect++;
      }
    }

    const masteryPercentage = this.calculateMasteryPercentage(questionsCorrect, totalQuestions);
    const masteryStatus = this.determineMasteryStatus(masteryPercentage, questionsAnswered);

    return {
      domain,
      domainName,
      totalQuestions,
      questionsAnswered,
      questionsCorrect,
      masteryPercentage,
      masteryStatus,
    };
  }

  /**
   * Get stats for all domains
   */
  static async getAllDomainStats(): Promise<DomainStats[]> {
    const domains = await QuestionService.getAllDomains();
    const stats: DomainStats[] = [];

    for (const domain of domains) {
      const domainStats = await this.getDomainStats(domain);
      stats.push(domainStats);
    }

    return stats.sort((a, b) => a.domain.localeCompare(b.domain));
  }

  /**
   * Get overall statistics
   */
  static async getOverallStats(): Promise<OverallStats> {
    const totalQuestions = await QuestionService.getTotalQuestionCount();
    const questionsAnswered = await AnswerService.getTotalAnsweredCount();
    const questionsCorrect = await AnswerService.getCorrectAnswersCount();

    const allDomainStats = await this.getAllDomainStats();
    const domainsStarted = allDomainStats.filter((s) => s.questionsAnswered > 0).length;
    const domainsMastered = allDomainStats.filter((s) => s.masteryStatus === 'mastered').length;

    // Calculate average mastery percentage
    let averageMasteryPercentage = 0;
    if (domainsStarted > 0) {
      const totalPercentage = allDomainStats.reduce((sum, stats) => sum + stats.masteryPercentage, 0);
      averageMasteryPercentage = Math.round(totalPercentage / domainsStarted);
    }

    return {
      totalQuestions,
      questionsAnswered,
      questionsCorrect,
      averageMasteryPercentage,
      domainsStarted,
      domainsMastered,
    };
  }

  /**
   * Get question IDs from weak domains (below 70% mastery)
   */
  static async getWeakAreaQuestionIds(): Promise<number[]> {
    const allStats = await this.getAllDomainStats();
    const weakDomains = allStats
      .filter((s) => s.masteryStatus !== 'notStarted' && s.masteryPercentage < 70)
      .sort((a, b) => a.masteryPercentage - b.masteryPercentage);

    if (weakDomains.length === 0) {
      // Fallback: take lowest mastery domains that have been started
      const started = allStats.filter((s) => s.masteryStatus !== 'notStarted');
      if (started.length === 0) return [];
      weakDomains.push(...started.sort((a, b) => a.masteryPercentage - b.masteryPercentage).slice(0, 2));
    }

    const ids: number[] = [];
    for (const domain of weakDomains.slice(0, 3)) {
      const questions = await QuestionService.getFilteredQuestions(domain.domain);
      for (const q of questions) {
        const status = await AnswerService.getAnswerStatus(q.id);
        if (status === 'unanswered' || status === 'answeredIncorrectly') {
          ids.push(q.id);
        }
      }
    }

    // Shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    return ids;
  }

}
