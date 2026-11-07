# TierBuild

Full-stack TypeScript monorepo (npm workspaces): `apps/web` (React + Vite), `apps/server` (Express), `packages/shared` (shared types). See README.md for scripts.

## Git workflow (default for all changes)

Follow CONTRIBUTING.md. In short:

- Never commit directly to `main`. Work on a branch from an up-to-date `main`.
- One branch = one purpose. If a request mixes unrelated changes, split them into separate branches and PRs, and say so.
- Before pushing, run `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`. Fix failures; never skip or disable tests to get green.
- When a change is complete, open a PR into `main` using `.github/pull_request_template.md`. Explain the change in the description.
- Do not merge PRs. The repo owner reviews and merges (squash).
- Never add commits to a branch whose PR has already merged; restart the branch from `main`.

The owner is learning Git: briefly explain the Git steps you take and why.

## Conventions

- TypeScript is pinned to ~6.0 because typescript-eslint does not support 7 yet.
- Server runtime dependencies go in `dependencies` (tsup bundles devDependencies).
