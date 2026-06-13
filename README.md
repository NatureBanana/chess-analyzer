# Chess Analyzer

Deep stats and playstyle profiles built from real Chess.com games. Enter a username to explore openings, color performance, Elo breakdown, head-to-head compare, win plans, and ChessDNA personality cards.

## Stack

React + Vite, deployed on Vercel. Chess.com API traffic is proxied through `/api/chess` (allowlisted to `api.chess.com/pub/` only).

## Development

```bash
npm install
npm run dev
```

```bash
npm run build   # production build
npm run lint    # ESLint
npm run preview # preview production build
```

## Live site

[https://ch3ss-analyzer.vercel.app/](https://ch3ss-analyzer.vercel.app/)
