# TierBuild

Full-stack TypeScript app: React (Vite) frontend and Express backend in an npm workspaces monorepo.

## Layout

```
apps/
  web/        React + Vite frontend (port 5173, proxies /api to the server)
  server/     Express API (port 3001)
packages/
  shared/     Types shared by web and server
```

## Getting started

Requires Node 22+.

```bash
npm install
npm run dev
```

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run the web and server dev servers   |
| `npm run build`     | Build all workspaces                 |
| `npm test`          | Run tests (Vitest) in all workspaces |
| `npm run typecheck` | Type-check all workspaces            |
| `npm run lint`      | Lint with ESLint                     |
| `npm run format`    | Format with Prettier                 |
