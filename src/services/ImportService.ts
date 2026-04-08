import { ImportLog, ParseError } from '../types/index';
import { db } from '../db/database';
import { CSVParser } from './CSVParser';
import { QuestionService } from './QuestionService';

export class ImportService {
  /**
   * Import questions from CSV file
   */
  static async importFromFile(file: File): Promise<{
    success: boolean;
    questionsImported: number;
    questionsSkipped: number;
    errors: ParseError[];
    importLogId?: string;
  }> {
    try {
      // Read file content
      const content = await file.text();

      // Parse CSV
      const { questions, errors } = CSVParser.parseCSV(content);

      // Import questions
      if (questions.length > 0) {
        await QuestionService.importQuestions(questions);
      }

      // Create import log
      const importLog: ImportLog = {
        id: `import-${Date.now()}`,
        importDate: new Date(),
        fileName: file.name,
        questionsImported: questions.length,
        questionsSkipped: errors.length,
        errors,
      };

      await db.importLogs.add(importLog);

      return {
        success: errors.length === 0,
        questionsImported: questions.length,
        questionsSkipped: errors.length,
        errors,
        importLogId: importLog.id,
      };
    } catch (err) {
      return {
        success: false,
        questionsImported: 0,
        questionsSkipped: 0,
        errors: [
          {
            type: 'encodingError',
            details: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  /**
   * Get all import logs
   */
  static async getImportLogs(): Promise<ImportLog[]> {
    return db.importLogs
      .toArray()
      .then((logs) => logs.sort((a, b) => b.importDate.getTime() - a.importDate.getTime()));
  }

}
