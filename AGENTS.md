# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Chess DNA (`chess-analyzer`) is a single-page React + Vite app that analyzes Chess.com players. There is no backend in this repo; the browser fetches data from the Chess.com public API at runtime (with optional CORS proxy fallbacks).

### Services

| Service | Command | URL |
|---------|---------|-----|
| Vite dev server (required) | `npm run dev` | http://localhost:5173 |

No database, Docker, or `.env` configuration is required.

### Standard commands

See `package.json` scripts:

- **Install deps:** `npm install`
- **Dev server:** `npm run dev`
- **Lint:** `npm run lint` (ESLint; may report pre-existing issues in `src/App.jsx`)
- **Build:** `npm run build` → `dist/`
- **Preview build:** `npm run preview` → http://localhost:4173

There is no test script or test framework configured in this repo.

### Dev server notes

- Start the dev server in a tmux session for long-running use (e.g. session name `vite-dev-server`).
- Bind to all interfaces when testing from the desktop browser: `npm run dev -- --host 0.0.0.0`
- Default Vite port is **5173**.

### Hello-world smoke test

1. Open http://localhost:5173
2. Enter a real Chess.com username (e.g. `hikaru`)
3. Click **Analyze Player**
4. Confirm the dashboard loads (Overview, Openings, Color Stats, etc.)

Requires outbound network access to `api.chess.com` (and possibly CORS proxy endpoints if direct fetch is blocked).
