import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ResultBannerProps {
  isCorrect: boolean;
  correctAnswer: string;
  action?: React.ReactNode;
}

export function ResultBanner({ isCorrect, correctAnswer, action }: ResultBannerProps) {
  const isMulti = correctAnswer.includes(',');

  return (
    <div className={`rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300 ${
      isCorrect
        ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20'
        : 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200/50 dark:border-rose-500/20'
    }`}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          {isCorrect ? (
            <>
              <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Correct!</h3>
            </>
          ) : (
            <>
              <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-500" />
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-400">Incorrect</h3>
            </>
          )}
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium ml-10">
          {isMulti
            ? <>The correct answers are <strong>{correctAnswer.split(',').join(', ')}</strong></>
            : <>The correct answer is <strong>{correctAnswer}</strong></>
          }
        </p>
      </div>
      {action}
    </div>
  );
}
