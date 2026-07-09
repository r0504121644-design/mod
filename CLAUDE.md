# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

מסע התעסוקתיות ("The Employability Journey") is a Hebrew (RTL), single-page React app for personal/career development self-assessment. Users self-rate across 10 competencies, get a percentage score and radar-chart visualization, complete suggested exercises per competency, and keep freeform notes — all persisted client-side in `localStorage`. There is no backend; it's a static site meant to be deployed to Vercel or Netlify (see README.md for deployment steps, in Hebrew).

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

There is no test suite, linter, or type checker configured in this repo — don't invent commands for them.

## Architecture

The entire app is two files:

- `src/main.jsx` — standard Vite/React entry point, mounts `<App />` into `#root`.
- `src/App.jsx` — the whole application (~480 lines): data, styles, and all UI in one component tree. There are no other components, no router, no state management library, and no API layer.

Key structure within `App.jsx`:

- **`COMPETENCIES`** — a hardcoded array of 10 competency objects (e.g. `self_awareness`, `resilience`, `communication`). Each has `id`, `name`, `icon`, `color`, `shortName`, an array of `questions` (self-assessment statements rated 1-5), and an array of `exercises` (`title`, `duration`, `desc`). This is the single source of truth for all app content — adding/editing a competency or its questions/exercises means editing this array directly; there is no CMS or external data file.
- **`SCORE_LABELS`** / **`getScoreInfo(pct)`** — maps a 0-100 percentage to a label/color bucket (זקוק לפיתוח / בפיתוח / חזק).
- **`lsGet` / `lsSet`** — thin `localStorage` JSON helpers, used for all persistence. Storage keys: `emp_scores`, `emp_ex`, `emp_notes`.
- **`Ring`** — small inline SVG circular-progress component, reused for score displays.
- **`css`** template string — all custom CSS (buttons, cards, tabs, textarea) is injected via a `<style>{css}</style>` tag inside `App`; there are no separate CSS files or CSS-in-JS libraries. Most one-off layout styling is done with inline `style={{}}` objects instead.
- **`App()`** — single component holding all state (`screen`, `selId`, `tab`, `scores`, `exDone`, `notes`, `answers`, `saved`) and rendering everything conditionally:
  - `screen === "home"`: dashboard — summary stats, radar chart (once ≥3 competencies scored), and a grid of competency cards.
  - `screen === "comp"`: a selected competency's detail view with three tabs (`tab` state): `diagnose` (rate the 1-5 questions and save a score), `exercises` (checklist of 3 exercises), `track` (score breakdown per question + notes textarea).

There is no client-side routing — `screen`/`tab` are plain state, not URL-driven.

## Conventions

- All UI strings and content are Hebrew, and the app is RTL (`dir="rtl"` set in `index.html` and again in the root `App` div). Keep any new UI text in Hebrew and RTL-consistent with the existing tone/style.
- Styling is a mix of the injected `css` string (for reusable classes like `.card`, `.btn-primary`, `.rating-btn`, `.tab-btn`, `.ex-card`) and inline `style` objects for layout/spacing. Follow whichever pattern the surrounding code already uses rather than introducing a new styling approach (e.g. CSS modules, styled-components, Tailwind).
- Color palette is fixed to the app's dark theme: background `#080f1e`, gold accent `#c9a84c`, plus each competency's own `color`. Reuse these rather than introducing new colors.
- All persisted app state goes through `lsGet`/`lsSet`; both wrap failures in try/catch and fail silently (`localStorage` may be unavailable/full). Follow this pattern for any new persisted state rather than calling `localStorage` directly.
- `vite.config.js` explicitly suppresses Rollup's `MODULE_LEVEL_DIRECTIVE` warning (needed because some dependency uses top-level `"use client"`/directives) — don't remove that without checking the build still warns cleanly.
