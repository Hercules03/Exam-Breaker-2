# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build (`tsc -b && vite build`)
- `npm run preview` — Preview production build locally
- `npm run deploy` — Build and deploy to GitHub Pages via gh-pages

No test framework is configured. Verify changes with `npm run build` (runs `tsc -b`).

## Architecture

React 18 + TypeScript SPA for practicing multiple-choice exam questions. Mobile-first, deployed to GitHub Pages at `/Exam-Breaker-2/` base path.

**Routing**: No router library. `App.tsx` manages navigation via `useState<NavigationState>` with a `PageType` union (`list | progress | settings | detail | exam | flashcards | studySession`). Pages receive `onNavigate` and `onBack` callbacks.

**Data layer**: Dexie (IndexedDB wrapper) in `src/db/database.ts`. Eight tables across two schema versions:
- v1: `questions`, `userAnswers`, `importLogs`, `bookmarks`
- v2 adds: `examResults`, `studyActivity`, `questionNotes`, `questionFlags`

All data is local/offline — no backend.

**Service layer** (`src/services/`): Static class methods that operate on the Dexie DB. Key services:
- `CSVParser` — Parses a specific v2 CSV format with headers: No., Question, OptionA-D, Answer, Domain, Name of domain, Simplified, Why the answer is correct, Why others are incorrect, Key words, Full_Question. Supports multi-answer questions (e.g. "A,B,D").
- `ImportService` — Orchestrates file read -> CSV parse -> DB insert
- `SpacedRepetitionService` — Weighted random question selection (unanswered=10, incorrect=8, correct=days-based decay)
- `ExamService` / `FlashcardService` — Timed exam mode and flashcard sessions
- `CATService` — Computerized Adaptive Testing: IRT-based difficulty estimation, ability tracking (theta/SE), and adaptive question selection
- `AnswerService` / `ProgressService` — Answer recording and per-domain mastery stats
- `BookmarkService` / `ExportService` — Bookmarking and data export
- `ExamHistoryService` — Persists and retrieves saved exam results
- `NoteService` / `FlagService` — Per-question user notes and flagging
- `StudyActivityService` — Daily study activity tracking (questions studied/correct)

**Hooks** (`src/hooks/`): React hooks wrapping service calls (`useQuestions`, `useAnswers`, `useProgress`, `useExam`, `useExamHistory`, `useBookmarks`, `useImport`, `useNote`, `useFlag`, `useStudyActivity`, `useStudySession`, `useDarkMode`, `useScrollDirection`).

**Styling**: Tailwind CSS with dark mode support (class-based). No component library. Icons from `lucide-react`.

**LaTeX**: `LatexText` component renders LaTeX via KaTeX for math notation in questions.

## Key Types

Defined in `src/types/index.ts`: `Question`, `UserAnswer`, `ExamSession`, `ExamResult`, `SavedExamResult`, `ExamConfig`, `Bookmark`, `DomainStats`, `ImportLog`, `ParseError`, `StudyActivity`, `QuestionNote`, `QuestionFlag`, `StudySessionConfig`, `CATState`, `CATResponse`, `CATResultData`.

Questions support single or multiple correct answers (`correctAnswer` field stores "A" or "A,B,D").

CAT exam mode uses `CATState` to track ability estimate (theta on logit scale), standard error, and termination conditions (`confidence | maxQuestions | timeUp`). Results include a scaled score (0-1000, pass >= 700).
