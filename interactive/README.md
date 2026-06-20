# Helmsman — A Kubernetes Voyage

An interactive, **frontend-only** companion to the [CKA-2024](https://github.com/piyushsachdeva/CKA-2024)
course. Each lesson becomes a small, self-contained puzzle: drag cargo crates, assemble Dockerfiles,
wire Services, reconcile replicas. _Kubernetes_ means **helmsman** — the pilot who steers the ship —
so the whole thing is dressed as a **Harbor Operations Console**.

> Pilot covers **Days 1–10**. The architecture is built to extend to the rest of the course.

## Run it locally

```bash
cd interactive
npm install
npm run dev      # start the dev server (Vite)
```

Then open the printed local URL. To preview a production build:

```bash
npm run build    # type-check (tsc) + bundle (vite) into dist/
npm run preview  # serve the built dist/ locally
```

There is **no backend and no deploy step** — everything is bundled and runs locally. Progress is
saved in your browser's `localStorage`; the hub has a **Reset progress** control.

## Scripts

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Vite dev server with HMR               |
| `npm run build`   | `tsc -b` type-check, then `vite build` |
| `npm run preview` | Serve the production build             |
| `npm run test`    | Run the Vitest unit tests              |
| `npm run lint`    | ESLint over `src`                      |
| `npm run format`  | Prettier write                         |

## How it works

- **Stack:** React + Vite + TypeScript (strict), plain CSS with semantic design tokens, `HashRouter`
  with a relative `base` so the built `dist/` is portable.
- **Hub** (`/`) is a voyage chart: ten ports plus a **helm-wheel progress compass** that lights as
  days are completed. Days unlock sequentially; completed days are replayable.
- **Day page** (`/day/dayNN`) is an instrument console: the game stage in the centre and a "Ship's
  Log" panel (objective, hints, timer, best stars) on the side.
- **Engine primitives** in `src/engine/` are reusable, accessible interaction building blocks
  (`DragSort`, `Sequencer`, `MatchPairs`, `Quiz`, `YamlBuilder`, `ConnectionBoard`). They own the
  _interaction_ and a11y input modes; each **day owns its own win condition and scoring**.
- **Scoring** is **accuracy-only**: 0–5 stars from wrong attempts at "Check"/"Submit" (5★ = flawless).
  Hints are free and never cost stars. Elapsed time is shown for personal interest, never as a fail.
- **Content rule:** each day's puzzle only uses concepts introduced on that day or earlier — no
  forward references. Puzzle data lives in `src/data/dayNN.ts`.

## Project layout

```
src/
  components/   shared UI (ObjectivePanel, HelmCompass, StarRating, CheckBar, StageStepper…)
  engine/       reusable interaction primitives + shared validation contract (types.ts)
  days/         one folder per day (dayNN/DayNN.tsx) + registry.ts (metadata + lazy imports)
  data/         per-day puzzle content/answers as typed TS
  pages/        Hub, DayPage, NotFound
  store/        zustand progress store (localStorage persistence)
  hooks/        useReducedMotion
  styles/       tokens.css (palette + semantic tokens), global.css
```

## Accessibility

Dark theme only, WCAG-AA contrast. Every drag interaction has a non-drag fallback (assign buttons,
move up/down, select-then-select). Visible keyboard focus, and `prefers-reduced-motion` is respected.
