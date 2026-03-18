import { db } from '../db/database';

export interface Flashcard {
  term: string;
  definition: string;
  domain: string;
  domainName: string;
  questionId: number;
}

export class FlashcardService {
  /**
   * Parse keyword-definition pairs from a question's keywords field.
   * Format: "Term: Definition" separated by blank lines.
   */
  static parseKeywords(
    keywords: string,
    domain: string,
    domainName: string,
    questionId: number
  ): Flashcard[] {
    if (!keywords || !keywords.trim()) return [];

    const cards: Flashcard[] = [];
    // Split by blank lines to get individual keyword blocks
    const blocks = keywords.split(/\n\s*\n/).filter((b) => b.trim());

    for (const block of blocks) {
      const trimmed = block.trim();
      // Match "Term: Definition" — the first colon separates term from definition
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const term = trimmed.slice(0, colonIndex).trim();
        const definition = trimmed.slice(colonIndex + 1).trim();
        if (term && definition) {
          cards.push({ term, definition, domain, domainName, questionId });
        }
      }
    }

    return cards;
  }

  /**
   * Get all flashcards from the database, optionally filtered by domain.
   */
  static async getAllFlashcards(domain?: string): Promise<Flashcard[]> {
    let questions;
    if (domain) {
      questions = await db.questions.where('domain').equals(domain).toArray();
    } else {
      questions = await db.questions.toArray();
    }

    const cards: Flashcard[] = [];
    for (const q of questions) {
      cards.push(
        ...this.parseKeywords(q.keywords, q.domain, q.domainName, q.id!)
      );
    }

    // Deduplicate by term (keep first occurrence)
    const seen = new Set<string>();
    return cards.filter((c) => {
      const key = c.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Shuffle an array using Fisher-Yates.
   */
  static shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
