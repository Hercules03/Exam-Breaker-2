import LatexText from './LatexText';

export default function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="space-y-2">
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="ml-4 flex gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <LatexText>{content}</LatexText>
            </div>
          );
        }

        if (line.startsWith('\t') && (trimmed.startsWith('•') || trimmed.startsWith('-'))) {
          const content = trimmed.replace(/^[•\-]\s*/, '');
          return (
            <div key={idx} className="ml-6 flex gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <LatexText>{content}</LatexText>
            </div>
          );
        }

        if (trimmed.startsWith('➡')) {
          return (
            <p key={idx} className="text-slate-700 dark:text-slate-300 font-medium mt-2">
              <LatexText>{trimmed}</LatexText>
            </p>
          );
        }

        if (trimmed === '⸻' || trimmed === '---') {
          return <hr key={idx} className="border-slate-200 dark:border-slate-700/50 my-3" />;
        }

        const optionHeaderMatch = trimmed.match(/^([A-D])[.)]+\s+(.*)/);
        if (optionHeaderMatch) {
          return (
            <p key={idx} className="font-semibold text-slate-900 dark:text-slate-100 mt-4">
              <LatexText>{trimmed}</LatexText>
            </p>
          );
        }

        return (
          <p key={idx} className="text-slate-800 dark:text-slate-200">
            <LatexText>{trimmed}</LatexText>
          </p>
        );
      })}
    </div>
  );
}
