import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 p-10 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{description}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
