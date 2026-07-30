# CLAUDE.md

This repo contains **two unrelated projects**. Only work on the one the user names; never scan or read files from the other.

## Project 1: stock-radar (repo root) — Stock analysis web app

- `app.py` — FastAPI backend: REST endpoints, SQLite cache (`output/cache.db`), APScheduler daily scan. Serves PWA from `static/`.
- `analysis_engine.py` — All analysis logic (899 lines): indicators, scoring, backtest, Kelly sizing, Monte Carlo, LightGBM prediction, Telegram/email alerts. Search for the specific function instead of reading the whole file.
- `static/` — PWA frontend (`index.html`, `manifest.json`).
- Run: `uvicorn app:app --port 8000`. Deploy: Railway (`railway.toml`, `Procfile`).
- Env vars: see `.env.example` (Telegram bot + SMTP alerts).

## Project 2: kid-star/ — 星星學園, kids learning PWA (React)

- Vite + React 18 + Tailwind, no backend. Deployed to GitHub Pages via `.github/workflows/deploy-kid-star.yml` on push to main.
- `src/pages/` — Home, Quiz, MathGame, MemoryMatch, ParentDashboard.
- `src/games/` — 12 mini-games, registered in `src/games/registry.js`.
- `src/lib/` — quizEngine, progress/storage, speech, sound, focus tracking.
- `src/data/questions/*.json` — question banks (50–64KB each). **Do not read these files whole**; grep for the specific question ID or sample a few lines instead.
- `src/data/*.js` — other content data (stories, dictation words, levels).
- Run: `cd kid-star && npm run dev`. Build: `npm run build`.

## Working rules (token efficiency)

- Read only the files needed for the task; prefer Grep/Glob over reading whole files.
- Never dump large JSON data files or long command output into the conversation.
- The two projects share nothing — a change in one never requires checking the other.
