# Gemini CLI Project Context: Exam Breaker 2

## Project Overview
**Exam Breaker 2** is a mobile-first, offline-capable web application (PWA) designed for practicing multiple-choice exams. It allows users to import question banks via CSV, track study progress with spaced repetition logic, take timed exams, and study via flashcards.

- **Main Technologies:** React 18, TypeScript 5, Vite 7, Tailwind CSS 3.4.
- **Database:** Dexie (IndexedDB wrapper) for persistent local storage.
- **Math Rendering:** KaTeX for LaTeX support in questions and answers.
- **Architecture:** Service-oriented architecture with logic separated into specialized services (`QuestionService`, `AnswerService`, `ProgressService`, etc.).
- **Navigation:** Custom state-based navigation in `App.tsx` (not using `react-router-dom`).

## Core Components & Structure
- `src/App.tsx`: Central navigation and state management.
- `src/db/database.ts`: Dexie database schema and initialization.
- `src/services/`: Core business logic (Import, Export, Question management, Progress tracking).
- `src/hooks/`: React hooks for shared logic (bookmarks, dark mode, scroll direction).
- `src/pages/`: Main application views (Exam, Flashcards, Progress, Settings).
- `src/types/`: TypeScript interfaces and types for the entire project.

## Building and Running
- **Development:** `npm run dev`
- **Build for Production:** `npm run build`
- **Preview Production Build:** `npm run preview`
- **Deploy to GitHub Pages:** `npm run deploy` (requires `gh-pages` configured)

## Development Conventions
- **State Management:** Uses React `useState` and `useEffect` in conjunction with Dexie for persistence.
- **Services:** Logic should be placed in the appropriate service class within `src/services/` to keep components clean.
- **Styling:** Tailwind CSS utility classes are used throughout. The app is mobile-first with a bottom tab navigation for small screens and top navigation for larger screens.
- **Data Persistence:** All user data (answers, bookmarks, imported questions) is stored locally in IndexedDB via Dexie. No backend is used.
- **CSV Format:** The app expects a specific CSV v2 format (Headers: `No.`, `Question`, `OptionA-D`, `Answer`, `Domain`, `Simplified`, `WhyCorrect`, `WhyIncorrect`, `Keywords`, `Full_Question`).

## Key Files for Investigation
- `src/db/database.ts`: Database schema.
- `src/types/index.ts`: Data models.
- `src/services/CSVParser.ts`: CSV parsing logic.
- `src/services/SpacedRepetitionService.ts`: Question weighting logic.
- `src/App.tsx`: Routing and main state.
