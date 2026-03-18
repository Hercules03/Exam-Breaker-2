import { Question, ParseError } from '../types/index';

export interface ParseResult {
  questions: Question[];
  errors: ParseError[];
}

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
      const normalized = headers.map((h) => h.toLowerCase().trim());

      // Validate v2 format
      const isV2 =
        (normalized.includes('no.') || normalized.includes('no')) &&
        normalized.includes('question') &&
        normalized.includes('optiona') &&
        normalized.includes('optionb') &&
        normalized.includes('optionc') &&
        normalized.includes('optiond') &&
        normalized.includes('answer') &&
        normalized.includes('why the answer is correct') &&
        normalized.includes('why others are incorrect');

      if (!isV2) {
        errors.push({
          type: 'encodingError',
          details: 'Unsupported CSV format. Expected v2 headers: No., Question, OptionA, OptionB, OptionC, OptionD, Answer, Domain, Name of domain, Simplified, Why the answer is correct, Why others are incorrect, Key words, Full_Question',
        });
        return { questions, errors };
      }

      // Create field index map
      const fieldIndex: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        fieldIndex[header.toLowerCase().trim()] = index;
      });

      // Parse data rows
      for (let rowNum = 1; rowNum < rows.length; rowNum++) {
        const fields = rows[rowNum];
        const row = rowNum + 1;

        try {
          this.parseRow(fields, fieldIndex, row, questions, errors);
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
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some((field) => field.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Parse a single row into a Question
   */
  private static parseRow(
    fields: string[],
    fieldIndex: { [key: string]: number },
    row: number,
    questions: Question[],
    errors: ParseError[]
  ): void {
    const id = this.getField(fields, fieldIndex, 'no.') || this.getField(fields, fieldIndex, 'no');
    const stem = this.getField(fields, fieldIndex, 'question');
    const optionA = this.getField(fields, fieldIndex, 'optiona');
    const optionB = this.getField(fields, fieldIndex, 'optionb');
    const optionC = this.getField(fields, fieldIndex, 'optionc');
    const optionD = this.getField(fields, fieldIndex, 'optiond');
    const correctAnswer = this.getField(fields, fieldIndex, 'answer');
    const domain = this.getField(fields, fieldIndex, 'domain');
    const domainName = this.getField(fields, fieldIndex, 'name of domain');
    const simplified = this.getField(fields, fieldIndex, 'simplified');
    const whyCorrect = this.getField(fields, fieldIndex, 'why the answer is correct');
    const whyIncorrect = this.getField(fields, fieldIndex, 'why others are incorrect');
    const keywords = this.getField(fields, fieldIndex, 'key words');
    const fullQuestion = this.getField(fields, fieldIndex, 'full_question');

    if (!id) { errors.push({ type: 'missingFieldId', row }); return; }
    if (!stem) { errors.push({ type: 'missingFieldQuestion', row }); return; }
    if (!optionA || !optionB || !optionC || !optionD) { errors.push({ type: 'missingFieldAnswer', row }); return; }
    // Support single ("B") or multiple ("A,B,D") answers
    const answerParts = correctAnswer
      ? correctAnswer.toUpperCase().split(/[,\s]+/).map(a => a.trim()).filter(Boolean)
      : [];
    if (answerParts.length === 0 || !answerParts.every(a => VALID_ANSWERS.includes(a))) {
      errors.push({ type: 'invalidAnswerFormat', row, value: correctAnswer || '' }); return;
    }
    if (!domain) { errors.push({ type: 'missingFieldDomain', row }); return; }

    const question: Question = {
      id: parseInt(id, 10),
      stem: stem.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer: answerParts.join(','),
      domain: domain.trim(),
      domainName: (domainName || '').trim(),
      simplified: (simplified || '').trim(),
      whyCorrect: (whyCorrect || '').trim(),
      whyIncorrect: (whyIncorrect || '').trim(),
      keywords: (keywords || '').trim(),
      fullQuestion: (fullQuestion || '').trim(),
      createdAt: new Date(),
    };

    questions.push(question);
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
