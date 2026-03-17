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
   * Import questions from CSV text
   */
  static async importFromText(csvContent: string, fileName: string = 'imported.csv'): Promise<{
    success: boolean;
    questionsImported: number;
    questionsSkipped: number;
    errors: ParseError[];
    importLogId?: string;
  }> {
    try {
      // Parse CSV
      const { questions, errors } = CSVParser.parseCSV(csvContent);

      // Import questions
      if (questions.length > 0) {
        try {
          await QuestionService.importQuestions(questions);
        } catch (importErr) {
          // If import fails, still log it but report the error
          const errorMsg = importErr instanceof Error ? importErr.message : 'Unknown import error';

          // If it's a duplicate key error, it means some questions were already in the database
          if (errorMsg.includes('Key already exists') || errorMsg.includes('ConstraintError')) {
            // Log the partial import success
            const importLog: ImportLog = {
              id: `import-${Date.now()}`,
              importDate: new Date(),
              fileName,
              questionsImported: questions.length,
              questionsSkipped: errors.length,
              errors: [
                ...errors,
                {
                  type: 'encodingError',
                  details: 'Some questions have duplicate IDs - they were overwritten with new data',
                },
              ],
            };
            await db.importLogs.add(importLog);

            return {
              success: true,
              questionsImported: questions.length,
              questionsSkipped: errors.length,
              errors: importLog.errors,
              importLogId: importLog.id,
            };
          }

          throw importErr;
        }
      }

      // Create import log
      const importLog: ImportLog = {
        id: `import-${Date.now()}`,
        importDate: new Date(),
        fileName,
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

  /**
   * Get a specific import log
   */
  static async getImportLog(id: string): Promise<ImportLog | undefined> {
    return db.importLogs.get(id);
  }

  /**
   * Delete an import log
   */
  static async deleteImportLog(id: string): Promise<void> {
    await db.importLogs.delete(id);
  }

  /**
   * Clear all import logs
   */
  static async clearImportLogs(): Promise<void> {
    await db.importLogs.clear();
  }

  /**
   * Get import statistics
   */
  static async getImportStats(): Promise<{
    totalImports: number;
    totalQuestionsImported: number;
    totalErrors: number;
    lastImportDate?: Date;
  }> {
    const logs = await this.getImportLogs();

    let totalQuestionsImported = 0;
    let totalErrors = 0;

    for (const log of logs) {
      totalQuestionsImported += log.questionsImported;
      totalErrors += log.questionsSkipped;
    }

    return {
      totalImports: logs.length,
      totalQuestionsImported,
      totalErrors,
      lastImportDate: logs.length > 0 ? logs[0].importDate : undefined,
    };
  }
}
