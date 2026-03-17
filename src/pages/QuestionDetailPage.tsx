import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuestion } from '../hooks/useQuestions';
import { useSubmitAnswer, useAnswerHistory } from '../hooks/useAnswers';
import { PageType, NavigationMode } from '../App';
import { QuestionService } from '../services/QuestionService';

interface ExplanationSection {
  emoji: string;
  title: string;
  type: 'correct' | 'incorrect';
  content: string;
}

/**
 * Parse explanation into separate sections based on emoji markers
 * Falls back to showing entire explanation if no emoji patterns found
 */
function parseExplanationSections(explanation: string): ExplanationSection[] {
  const sections: ExplanationSection[] = [];
  const lines = explanation.split('\n');

  let currentSection: Partial<ExplanationSection> | null = null;
  let contentLines: string[] = [];
  let foundAnyPatterns = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for section headers with emoji
    const correctMatch = trimmed.match(/^✅\s+(.+)/);
    const incorrectMatch = trimmed.match(/^❌\s+(.+)/);

    if (correctMatch) {
      foundAnyPatterns = true;
      // Save previous section
      if (currentSection) {
        sections.push({
          emoji: currentSection.emoji || '✅',
          title: currentSection.title || 'Section',
          type: currentSection.type || 'correct',
          content: contentLines.join('\n').trim(),
        });
      }

      // Start new section
      currentSection = {
        emoji: '✅',
        title: correctMatch[1],
        type: 'correct',
      };
      contentLines = [];
    } else if (incorrectMatch) {
      foundAnyPatterns = true;
      // Save previous section
      if (currentSection) {
        sections.push({
          emoji: currentSection.emoji || '❌',
          title: currentSection.title || 'Section',
          type: currentSection.type || 'incorrect',
          content: contentLines.join('\n').trim(),
        });
      }

      // Start new section
      currentSection = {
        emoji: '❌',
        title: incorrectMatch[1],
        type: 'incorrect',
      };
      contentLines = [];
    } else if (currentSection) {
      // Add to current section content
      contentLines.push(line);
    } else {
      // No pattern found yet, collect all lines
      contentLines.push(line);
    }
  }

  // Add last section
  if (currentSection) {
    sections.push({
      emoji: currentSection.emoji || '❌',
      title: currentSection.title || 'Section',
      type: currentSection.type || 'incorrect',
      content: contentLines.join('\n').trim(),
    });
  }

  // If no emoji patterns were found but there is content, show as single section
  if (!foundAnyPatterns && contentLines.length > 0) {
    sections.push({
      emoji: '✅',
      title: 'Explanation',
      type: 'correct',
      content: contentLines.join('\n').trim(),
    });
  }

  return sections;
}

interface QuestionDetailPageProps {
  questionId: number;
  onBack: () => void;
  onNavigate: (page: PageType, questionId?: number, domain?: string, navigationMode?: NavigationMode) => void;
  navigationMode: NavigationMode;
  selectedDomain?: string;
}

export default function QuestionDetailPage({
  questionId,
  onBack,
  onNavigate,
  navigationMode,
  selectedDomain,
}: QuestionDetailPageProps) {
  const { question, loading: questionLoading } = useQuestion(questionId);
  const { submitAnswer, submitting, error: submitError } = useSubmitAnswer();
  const { history, refresh: refreshHistory } = useAnswerHistory(questionId);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ isCorrect: boolean } | null>(null);
  const [showCorrectExplanation, setShowCorrectExplanation] = useState(false);
  const [showIncorrectExplanation, setShowIncorrectExplanation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const prevQuestionIdRef = useRef(questionId);
  const isNavigatingRef = useRef(false);

  // Reset states when question ID changes
  useEffect(() => {
    const isNewQuestion = prevQuestionIdRef.current !== questionId;
    prevQuestionIdRef.current = questionId;

    if (isNewQuestion) {
      // Reset UI state for new question
      setSelectedAnswer(null);
      setShowExplanation(false);
      setSubmitResult(null);
      setShowCorrectExplanation(false);
      setShowIncorrectExplanation(false);
      setShowHistory(false);
    }
  }, [questionId]);

  // If question was already answered, show explanation automatically (but not when navigating via next)
  useEffect(() => {
    if (isNavigatingRef.current) {
      // Skip auto-show when navigating via next button
      isNavigatingRef.current = false;
      return;
    }

    if (history.length > 0 && question && selectedAnswer === null) {
      // Only auto-show if we haven't already set an answer in this session
      const lastAnswer = history[history.length - 1];
      setSelectedAnswer(lastAnswer.selectedAnswer as 'A' | 'B' | 'C' | 'D');
      setSubmitResult({ isCorrect: lastAnswer.isCorrect });
      setShowExplanation(true);
    }
  }, [history, question]);

  const handleNextQuestion = async () => {
    try {
      isNavigatingRef.current = true;
      if (navigationMode === 'random') {
        // Get next random unanswered question
        const nextQuestion = await QuestionService.getRandomQuestion(undefined, 'unanswered');
        if (nextQuestion) {
          onNavigate('detail', nextQuestion.id, selectedDomain, 'random');
        }
      } else {
        // Get next question in sequence
        if (question) {
          const allQuestions = await QuestionService.getFilteredQuestions(selectedDomain);
          const currentIndex = allQuestions.findIndex(q => q.id === question.id);

          if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
            const nextQuestion = allQuestions[currentIndex + 1];
            onNavigate('detail', nextQuestion.id, selectedDomain, 'direct');
          }
        }
      }
    } catch (err) {
      console.error('Failed to navigate to next question:', err);
    }
  };

  if (questionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 mb-4">Question not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;

    try {
      const result = await submitAnswer(questionId, selectedAnswer);
      setSubmitResult(result);
      await refreshHistory();
      setShowExplanation(true);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const options = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Question */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
            Question #{question.id}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
            {question.domain}
          </span>
          {history.length > 0 && (
            <span className="text-sm text-gray-600">
              Attempt: {history.length}
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">{question.stem}</h2>

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {options.map((option) => {
            const optionText = question[`option${option}`];
            const isSelected = selectedAnswer === option;
            const isCorrect = option === question.correctAnswer;
            const wasAnsweredIncorrectly =
              submitResult && !submitResult.isCorrect && isSelected;

            let bgColor = 'bg-white hover:bg-gray-50';
            let borderColor = 'border-gray-200';

            if (showExplanation) {
              if (isCorrect) {
                bgColor = 'bg-green-50';
                borderColor = 'border-correct';
              } else if (wasAnsweredIncorrectly) {
                bgColor = 'bg-red-50';
                borderColor = 'border-incorrect';
              }
            }

            return (
              <button
                key={option}
                onClick={() => !showExplanation && setSelectedAnswer(option)}
                disabled={showExplanation || submitting}
                className={`w-full text-left p-4 border-2 rounded-lg transition ${bgColor} border-${borderColor} ${
                  isSelected && !showExplanation ? 'border-blue-500 bg-blue-50' : ''
                } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border-2 border-current font-semibold">
                    {option}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-900">{optionText}</p>
                  </div>
                  {showExplanation && isCorrect && (
                    <CheckCircle className="w-6 h-6 text-correct flex-shrink-0" />
                  )}
                  {showExplanation && wasAnsweredIncorrectly && (
                    <XCircle className="w-6 h-6 text-incorrect flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {!showExplanation && (
          <button
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer || submitting}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        )}

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {submitError}
          </div>
        )}
      </div>

      {/* Explanation Result */}
      {showExplanation && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center gap-3 mb-2">
            {submitResult?.isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6 text-correct" />
                <h3 className="text-xl font-bold text-correct">Correct!</h3>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-incorrect" />
                <h3 className="text-xl font-bold text-incorrect">Incorrect</h3>
              </>
            )}
          </div>
          <p className="text-gray-700 mb-6">
            The correct answer is <strong>{question.correctAnswer}</strong>
          </p>
        </div>
      )}

      {/* Explanation Cards */}
      {showExplanation && (
        <div className="space-y-4">
          {/* No Explanation Available */}
          {!question.explanation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">No explanation available for this question.</p>
            </div>
          )}

          {/* Correct Answer Explanation Card */}
          {question.explanation && parseExplanationSections(question.explanation)
            .filter((s) => s.type === 'correct')
            .map((section, idx) => (
              <div
                key={`correct-${idx}`}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <button
                  onClick={() => setShowCorrectExplanation(!showCorrectExplanation)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-green-50 border-b border-green-200 hover:bg-green-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-correct flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  {showCorrectExplanation ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  )}
                </button>

                {showCorrectExplanation && (
                  <div className="px-6 py-4 text-gray-800 leading-relaxed space-y-3">
                    {section.content.split('\n').map((line, lineIdx) => {
                      // Format bullet points
                      if (line.trim().startsWith('•')) {
                        return (
                          <div key={lineIdx} className="ml-4 flex gap-3">
                            <span className="text-gray-400 flex-shrink-0">•</span>
                            <span>{line.replace('•', '').trim()}</span>
                          </div>
                        );
                      }

                      // Skip empty lines but preserve spacing
                      if (!line.trim()) {
                        return <div key={lineIdx} className="h-1" />;
                      }

                      // Format regular lines
                      return (
                        <p key={lineIdx} className="text-gray-800">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

          {/* Incorrect Options Explanation Card */}
          {question.explanation && parseExplanationSections(question.explanation)
            .filter((s) => s.type === 'incorrect')
            .map((section, idx) => (
              <div
                key={`incorrect-${idx}`}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <button
                  onClick={() => setShowIncorrectExplanation(!showIncorrectExplanation)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-red-50 border-b border-red-200 hover:bg-red-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-incorrect flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                  </div>
                  {showIncorrectExplanation ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  )}
                </button>

                {showIncorrectExplanation && (
                  <div className="px-6 py-4 text-gray-800 leading-relaxed space-y-3">
                    {section.content.split('\n').map((line, lineIdx) => {
                      // Format bullet points
                      if (line.trim().startsWith('•')) {
                        return (
                          <div key={lineIdx} className="ml-4 flex gap-3">
                            <span className="text-gray-400 flex-shrink-0">•</span>
                            <span>{line.replace('•', '').trim()}</span>
                          </div>
                        );
                      }

                      // Skip empty lines but preserve spacing
                      if (!line.trim()) {
                        return <div key={lineIdx} className="h-1" />;
                      }

                      // Format regular lines
                      return (
                        <p key={lineIdx} className="text-gray-800">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Answer History */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900">Answer History</h3>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
            )}
          </button>

          {showHistory && (
            <div className="px-8 py-4 border-t border-gray-200 space-y-3">
              {history.map((answer, index) => (
                <div
                  key={answer.id}
                  className="p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-correct" />
                      ) : (
                        <XCircle className="w-5 h-5 text-incorrect" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          Attempt {index + 1}: {answer.selectedAnswer}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(answer.answeredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
        >
          Back to Questions
        </button>
        {showExplanation && (
          <button
            onClick={handleNextQuestion}
            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
