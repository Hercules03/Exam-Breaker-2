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
   * Get domains ordered by mastery status priority (needsReview > progressing > mastered > notStarted)
   */
  static async getDomainsPrioritized(): Promise<DomainStats[]> {
    const allStats = await this.getAllDomainStats();

    const statusPriority: { [key in MasteryStatus]: number } = {
      needsReview: 0,
      progressing: 1,
      mastered: 2,
      notStarted: 3,
    };

    return allStats.sort((a, b) => {
      const priorityDiff = statusPriority[a.masteryStatus] - statusPriority[b.masteryStatus];
      if (priorityDiff !== 0) return priorityDiff;
      return a.domain.localeCompare(b.domain);
    });
  }

  /**
   * Get progress summary for a domain
   */
  static async getDomainProgressSummary(
    domain: string
  ): Promise<{
    domain: string;
    progress: number; // 0-100
    status: MasteryStatus;
    answeredCount: number;
    totalCount: number;
    correctCount: number;
  }> {
    const stats = await this.getDomainStats(domain);
    const progress = stats.totalQuestions > 0 ?
      Math.round((stats.questionsAnswered / stats.totalQuestions) * 100) : 0;

    return {
      domain: stats.domain,
      progress,
      status: stats.masteryStatus,
      answeredCount: stats.questionsAnswered,
      totalCount: stats.totalQuestions,
      correctCount: stats.questionsCorrect,
    };
  }
}
