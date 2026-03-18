import { db } from '../db/database';

interface ExportData {
  version: 1;
  exportedAt: string;
  userAnswers: any[];
  bookmarks: any[];
}

export class ExportService {
  static async exportProgress(): Promise<string> {
    const userAnswers = await db.userAnswers.toArray();
    const bookmarks = await db.bookmarks.toArray();

    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userAnswers,
      bookmarks,
    };

    return JSON.stringify(data, null, 2);
  }

  static async importProgress(json: string): Promise<{ answersImported: number; bookmarksImported: number }> {
    const data: ExportData = JSON.parse(json);

    if (!data.version || !data.userAnswers) {
      throw new Error('Invalid backup file format');
    }

    let answersImported = 0;
    let bookmarksImported = 0;

    if (data.userAnswers.length > 0) {
      await db.userAnswers.bulkPut(data.userAnswers);
      answersImported = data.userAnswers.length;
    }

    if (data.bookmarks && data.bookmarks.length > 0) {
      await db.bookmarks.bulkPut(data.bookmarks);
      bookmarksImported = data.bookmarks.length;
    }

    return { answersImported, bookmarksImported };
  }

  static downloadAsFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
