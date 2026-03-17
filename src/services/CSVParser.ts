import { Question, ParseError } from '../types/index';

export interface ParseResult {
  questions: Question[];
  errors: ParseError[];
}

const REQUIRED_FIELDS = ['id', 'stem', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation', 'domain'];
const VALID_ANSWERS = ['A', 'B', 'C', 'D'];

export class CSVParser {
  /**
   * Parse CSV content and return questions with errors
   */
  static parseCSV(content: string): ParseResult {
    const questions: Question[] = [];
    const errors: ParseError[] = [];

    try {
      // Validate encoding
      const decoder = new TextDecoder('utf-8');
      try {
        decoder.decode(new TextEncoder().encode(content));
      } catch (err) {
        errors.push({
          type: 'encodingError',
          details: 'File is not valid UTF-8 encoded',
        });
        return { questions, errors };
      }

      // Parse all CSV rows (handles multi-line quoted fields)
      const rows = this.parseCSVContent(content);

      if (rows.length < 2) {
        errors.push({
          type: 'malformedRow',
          row: 0,
        });
        return { questions, errors };
      }

      // Parse header
      const headers = rows[0];

      // Detect CSV format (standard vs alternative)
      const format = this.detectFormat(headers);

      // Create field index map
      const fieldIndex: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        fieldIndex[header.toLowerCase()] = index;
      });

      // Parse data rows
      for (let rowNum = 1; rowNum < rows.length; rowNum++) {
        const fields = rows[rowNum];
        const row = rowNum + 1;

        try {
          if (format === 'standard') {
            // Standard format with separate option columns
            this.parseStandardFormat(fields, fieldIndex, row, questions, errors);
          } else if (format === 'alternative') {
            // Alternative format with question text containing options
            this.parseAlternativeFormat(fields, fieldIndex, row, questions, errors);
          } else {
            errors.push({ type: 'malformedRow', row });
          }
        } catch (err) {
          errors.push({ type: 'malformedRow', row });
        }
      }

      return { questions, errors };
    } catch (err) {
      errors.push({
        type: 'encodingError',
        details: `Parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
      return { questions, errors };
    }
  }

  /**
   * Parse CSV content handling multi-line quoted fields
   */
  private static parseCSVContent(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // Field delimiter
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        // Row delimiter (only outside quotes)
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some((field) => field.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        // Skip \r\n sequence
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    // Add last field and row
    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Detect CSV format based on headers
   */
  private static detectFormat(headers: string[]): 'standard' | 'alternative' | null {
    const normalized = headers.map((h) => h.toLowerCase().trim());

    // Check for standard format (id, stem, optionA, optionB, optionC, optionD, correctAnswer, explanation, domain)
    const hasStandardFields = REQUIRED_FIELDS.every((field) =>
      normalized.includes(field.toLowerCase())
    );

    if (hasStandardFields) {
      return 'standard';
    }

    // Check for alternative format (#, question, answer, explanation, domain)
    const hasAlternativeFields =
      (normalized.includes('#') || normalized.includes('id')) &&
      (normalized.includes('question') || normalized.includes('stem')) &&
      (normalized.includes('answer') || normalized.includes('correctanswer')) &&
      normalized.includes('explanation') &&
      normalized.includes('domain');

    if (hasAlternativeFields) {
      return 'alternative';
    }

    return null;
  }

  /**
   * Parse standard format (9 columns: id, stem, optionA, optionB, optionC, optionD, correctAnswer, explanation, domain)
   */
  private static parseStandardFormat(
    fields: string[],
    fieldIndex: { [key: string]: number },
    row: number,
    questions: Question[],
    errors: ParseError[]
  ): void {
    // Validate field count
    if (fields.length < REQUIRED_FIELDS.length) {
      errors.push({
        type: 'malformedRow',
        row,
      });
      return;
    }

    // Extract fields
    const id = this.getField(fields, fieldIndex, 'id');
    const stem = this.getField(fields, fieldIndex, 'stem');
    const optionA = this.getField(fields, fieldIndex, 'optionA');
    const optionB = this.getField(fields, fieldIndex, 'optionB');
    const optionC = this.getField(fields, fieldIndex, 'optionC');
    const optionD = this.getField(fields, fieldIndex, 'optionD');
    const correctAnswer = this.getField(fields, fieldIndex, 'correctAnswer');
    const explanation = this.getField(fields, fieldIndex, 'explanation');
    const domain = this.getField(fields, fieldIndex, 'domain');

    // Validate required fields
    if (!id) {
      errors.push({ type: 'missingFieldId', row });
      return;
    }

    if (!stem) {
      errors.push({ type: 'missingFieldQuestion', row });
      return;
    }

    if (!optionA || !optionB || !optionC || !optionD) {
      errors.push({ type: 'missingFieldAnswer', row });
      return;
    }

    if (!correctAnswer) {
      errors.push({ type: 'invalidAnswerFormat', row, value: '' });
      return;
    }

    if (!VALID_ANSWERS.includes(correctAnswer.toUpperCase())) {
      errors.push({ type: 'invalidAnswerFormat', row, value: correctAnswer });
      return;
    }

    if (!explanation) {
      errors.push({ type: 'missingFieldExplanation', row });
      return;
    }

    if (!domain) {
      errors.push({ type: 'missingFieldDomain', row });
      return;
    }

    // Create question object
    const question: Question = {
      id: parseInt(id, 10),
      stem: stem.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer: correctAnswer.toUpperCase() as 'A' | 'B' | 'C' | 'D',
      explanation: explanation.trim(),
      domain: domain.trim(),
      createdAt: new Date(),
    };

    questions.push(question);
  }

  /**
   * Parse alternative format (5 columns: id/#, question, answer, explanation, domain)
   * The question contains the full text with options embedded
   * Automatically extracts options if they follow the pattern:
   * A.) option text
   * B.) option text
   * C.) option text
   * D.) option text
   */
  private static parseAlternativeFormat(
    fields: string[],
    fieldIndex: { [key: string]: number },
    row: number,
    questions: Question[],
    errors: ParseError[]
  ): void {
    // Validate minimum fields
    if (fields.length < 3) {
      errors.push({
        type: 'malformedRow',
        row,
      });
      return;
    }

    // Extract fields for alternative format
    const id = this.getField(fields, fieldIndex, '#') || this.getField(fields, fieldIndex, 'id');
    const questionText = this.getField(fields, fieldIndex, 'question') || this.getField(fields, fieldIndex, 'stem');
    const correctAnswer = this.getField(fields, fieldIndex, 'answer') || this.getField(fields, fieldIndex, 'correctanswer');
    const explanation = this.getField(fields, fieldIndex, 'explanation') || '';
    const domain = this.getField(fields, fieldIndex, 'domain') || '';

    // Validate required fields
    if (!id) {
      errors.push({ type: 'missingFieldId', row });
      return;
    }

    if (!questionText) {
      errors.push({ type: 'missingFieldQuestion', row });
      return;
    }

    if (!correctAnswer) {
      errors.push({ type: 'invalidAnswerFormat', row, value: '' });
      return;
    }

    if (!VALID_ANSWERS.includes(correctAnswer.toUpperCase())) {
      errors.push({ type: 'invalidAnswerFormat', row, value: correctAnswer });
      return;
    }

    // Try to extract options from the question text
    const extracted = this.extractOptionsFromText(questionText);
    const { stem, optionA, optionB, optionC, optionD } = extracted;

    // Validate domain is not empty
    if (!domain) {
      errors.push({ type: 'missingFieldDomain', row });
      return;
    }

    // Validate explanation is not empty
    if (!explanation) {
      errors.push({ type: 'missingFieldExplanation', row });
      return;
    }

    // Create question object
    const question: Question = {
      id: parseInt(id, 10),
      stem: stem.trim(),
      optionA: optionA || '[See question]',
      optionB: optionB || '[See question]',
      optionC: optionC || '[See question]',
      optionD: optionD || '[See question]',
      correctAnswer: correctAnswer.toUpperCase() as 'A' | 'B' | 'C' | 'D',
      explanation: explanation.trim(),
      domain: domain.trim(),
      createdAt: new Date(),
    };

    questions.push(question);
  }

  /**
   * Extract question stem and options from text that contains embedded options
   * Pattern: Question text followed by A.) ... B.) ... C.) ... D.) ...
   */
  private static extractOptionsFromText(text: string): {
    stem: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
  } {
    // Split by newlines to find option lines
    const lines = text.split('\n').map((line) => line.trim());

    let stemLines: string[] = [];
    let optionA: string | undefined;
    let optionB: string | undefined;
    let optionC: string | undefined;
    let optionD: string | undefined;

    // Regex patterns for options - matches "A.) text" or "A) text"
    const optionPatterns = {
      A: /^A[.)]+\s*(.*)/i,
      B: /^B[.)]+\s*(.*)/i,
      C: /^C[.)]+\s*(.*)/i,
      D: /^D[.)]+\s*(.*)/i,
    };

    let foundFirstOption = false;

    for (const line of lines) {
      if (!line) continue;

      // Check if this line matches an option pattern
      const aMatch = line.match(optionPatterns.A);
      const bMatch = line.match(optionPatterns.B);
      const cMatch = line.match(optionPatterns.C);
      const dMatch = line.match(optionPatterns.D);

      if (aMatch) {
        foundFirstOption = true;
        optionA = aMatch[1].trim();
      } else if (bMatch) {
        optionB = bMatch[1].trim();
      } else if (cMatch) {
        optionC = cMatch[1].trim();
      } else if (dMatch) {
        optionD = dMatch[1].trim();
      } else if (!foundFirstOption) {
        // Haven't found options yet, add to stem
        stemLines.push(line);
      } else if (foundFirstOption && line) {
        // Found options but this line doesn't match - might be continuation
        // Try to append to the last option
        if (!optionD && optionC) {
          optionD = (optionD ? optionD + ' ' : '') + line;
        } else if (!optionC && optionB) {
          optionC = (optionC ? optionC + ' ' : '') + line;
        } else if (!optionB && optionA) {
          optionB = (optionB ? optionB + ' ' : '') + line;
        } else if (optionA) {
          optionA = optionA + ' ' + line;
        }
      }
    }

    return {
      stem: stemLines.join('\n'),
      optionA: optionA?.trim(),
      optionB: optionB?.trim(),
      optionC: optionC?.trim(),
      optionD: optionD?.trim(),
    };
  }

  /**
   * Get field value from parsed row
   */
  private static getField(
    fields: string[],
    fieldIndex: { [key: string]: number },
    fieldName: string
  ): string {
    const index = fieldIndex[fieldName.toLowerCase()];
    if (index === undefined || index >= fields.length) {
      return '';
    }
    return fields[index] || '';
  }
}
