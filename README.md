# THE ARCHITECT

**Build a better you.**

A focused, personal commitment/discipline system. Plan a commitment, execute
it with a built-in timer, and let the record speak for itself.

```
PLAN  →  EXECUTE  →  RECORD  →  REPEAT
```

This is a single-user, local-first app. It is not an AI coach, a chatbot, a
social network, or a gamified habit tracker — there are no points, streak
rewards, or scores. Just commitments, a timer, and a factual history.

## Features

- **Commitments** — a name, a daily time target, a duration in days, and a
  start date. One day record is generated for every scheduled day.
- **Timer** — start / pause / resume / stop. Elapsed time is calculated from
  timestamps (not a naive interval count), so it survives a page refresh,
  browser close, or reopen. Progress is capped at 100% of the daily target.
- **History** — a permanent, append-only record per day: `NOT STARTED`,
  `PARTIAL`, `MISSED`, `DONE`, or `COMPLETED LATE`. Scheduled dates never
  move, and history is never rewritten.
- **Progress** — factual totals: planned days, completed, partial, missed,
  completion %, and consistency %. No scoring, no gamification.
- **Settings** — dark (blueprint navy) / light (warm ivory) theme, a
  notification preference, JSON export/import, and a permanent reset with an
  explicit confirmation.

## Tech stack

- React + TypeScript + Vite
- IndexedDB for persistence (a small hand-written wrapper — no ORM)
- Plain CSS with design tokens (no CSS framework)
- React Router for navigation
- One React context (`AppContext`) for app state — no Redux/Zustand/Query
- Vitest for unit tests

## How to run

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run test       # run the unit test suite once
```

## Project structure

```
src/
  types.ts              Core data models (Commitment, DayRecord, TimerState, Settings)
  db/
    db.ts                Thin IndexedDB wrapper (open, get, put, indexes)
    repository.ts        Typed data-access functions used by the rest of the app
  timer/
    engine.ts            Pure timestamp-based timer math (unit tested)
  utils/
    date.ts              Local-calendar-day date helpers
    status.ts             Derives display status (MISSED, COMPLETED_LATE, etc.)
    progress.ts           Factual progress/consistency calculations
  context/
    AppContext.tsx        Single app-wide context; the only layer that talks to db/
  components/             Shared UI: Layout/nav, StatusBadge, ProgressRing, icons
  screens/                One file per screen (Welcome, Today, Timer, Commitments,
                           NewCommitment, CommitmentDetail, Progress, Settings)
  styles/                 Design tokens (theme.css) and global styles (global.css)
```

## Design system

The visual language is a technical "blueprint" aesthetic: dark navy in dark
mode, warm ivory in light mode, thin 1px borders, small corner radii, a
condensed serif wordmark, and a faint grid background. There is a persistent
sidebar (desktop) with a bottom tab bar on mobile (below ~768px).
