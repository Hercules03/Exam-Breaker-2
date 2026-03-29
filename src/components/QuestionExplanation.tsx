import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useQuestion } from '../hooks/useQuestions';
import LatexText from './LatexText';
import FormattedText from './FormattedText';

interface QuestionExplanationProps {
  questionId: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function QuestionExplanation({ questionId, selectedAnswer, correctAnswer, isCorrect }: QuestionExplanationProps) {
  const { question, loading } = useQuestion(questionId);
  const [showWhyCorrect, setShowWhyCorrect] = useState(!isCorrect);
  const [showWhyIncorrect, setShowWhyIncorrect] = useState(!isCorrect);
  const [showSimplified, setShowSimplified] = useState(false);

  if (loading || !question) {
    return <div className="py-4 text-center text-slate-400 text-sm">Loading...</div>;
  }

  const options = ['A', 'B', 'C', 'D'] as const;
  const correctSet = new Set(correctAnswer.split(','));
  const selectedSet = new Set(selectedAnswer ? selectedAnswer.split(',') : []);

  return (
    <div className="space-y-3">
      {/* Question stem */}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
        <LatexText>{question.stem}</LatexText>
      </p>

      {/* Options with correct/incorrect highlighting */}
      <div className="space-y-1.5">
        {options.map((opt) => {
          const isSelected = selectedSet.has(opt);
          const isCorrectOpt = correctSet.has(opt);
          let style = 'text-slate-500 dark:text-slate-400';
          if (isCorrectOpt) style = 'text-emerald-700 dark:text-emerald-400 font-semibold';
          else if (isSelected && !isCorrectOpt) style = 'text-rose-600 dark:text-rose-400 line-through';

          return (
            <div key={opt} className={`flex items-start gap-2 text-sm ${style}`}>
              <span className="font-bold flex-shrink-0 w-5">{opt}.</span>
              <span>
                <LatexText>{question[`option${opt}`]}</LatexText>
                {isCorrectOpt && <CheckCircle className="inline w-3.5 h-3.5 ml-1 text-emerald-500" />}
                {isSelected && !isCorrectOpt && <XCircle className="inline w-3.5 h-3.5 ml-1 text-rose-500" />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Explanation sections */}
      <div className="space-y-2 pt-2">
        {question.whyCorrect && (
          <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowWhyCorrect(!showWhyCorrect)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Why Correct
              </span>
              {showWhyCorrect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showWhyCorrect && (
              <div className="px-4 pb-3 text-sm text-slate-600 dark:text-slate-300">
                <FormattedText text={question.whyCorrect} />
              </div>
            )}
          </div>
        )}

        {question.whyIncorrect && (
          <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowWhyIncorrect(!showWhyIncorrect)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Why Others Incorrect
              </span>
              {showWhyIncorrect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showWhyIncorrect && (
              <div className="px-4 pb-3 text-sm text-slate-600 dark:text-slate-300">
                <FormattedText text={question.whyIncorrect} />
              </div>
            )}
          </div>
        )}

        {question.simplified && (
          <div className="border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSimplified(!showSimplified)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Simplified
              </span>
              {showSimplified ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSimplified && (
              <div className="px-4 pb-3 text-sm text-slate-600 dark:text-slate-300">
                <FormattedText text={question.simplified} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
