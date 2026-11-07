# TierBuild

## What this is

TierBuild is a performance-first gaming PC build checker. Every part gets a loot-rarity tier (Common → Mythic), and the user's monitor resolution + framerate set the target. It answers: what's holding this PC back for the panel you actually use?

This is a personal, non-commercial hobby project. Favor simple, readable code over clever or "enterprise" patterns.

## About me

I'm a product manager, not a professional developer, and I'm learning git and GitHub as I go.

- Explain each git command you run in one short line.
- When you make a design choice, tell me briefly why.
- If I ask for something that's a bad idea technically, say so before doing it.

## Tech stack

Full-stack TypeScript monorepo (npm workspaces). See README.md for scripts.

- `packages/shared`: catalog data (`data.ts`) and the bottleneck engine (`engine.ts`), used by both apps. Add tests for new engine logic.
- `apps/server`: Express API.
- `apps/web`: React + Vite frontend.

The original Flask app lives on the `legacy/Flask` branch as a reference while it is being ported. Its history is unrelated to `main`; never merge it.

## Product rules (don't break these)

- CPU is tiered on framerate only; GPU on resolution + framerate.
- RAM can cap a build but never boost it. PSU is a safety flag, not a bottleneck bar.
- Recommendation order is never driven by affiliate rate.
- Frame generation is excluded from tier math in v1.
- Out of scope for v1: budget builder, live pricing, accounts, full compatibility checks.

## Git workflow (default for all changes)

Follow CONTRIBUTING.md. In short:

- Never commit directly to `main`. Work on a branch from an up-to-date `main`, named `<type>/<description>` (e.g. `feat/build-api`).
- One branch = one purpose. If a request mixes unrelated changes, split them into separate branches and PRs, and say so.
- Make small commits after each working step, with a clear message saying what changed and why.
- Before pushing, run `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`. Fix failures; never skip or disable tests to get green.
- Before committing, show me a short summary of the diff.
- When a change is complete, open a PR into `main` using `.github/pull_request_template.md`. Explain the change in the description.
- Do not merge PRs. I review and merge (squash).
- Never add commits to a branch whose PR has already merged; restart the branch from `main`.
- Never commit secrets or `.env`. Never force-push, rewrite history, or delete branches without asking me first.

## How to work with me

- For anything bigger than a small fix, show me a plan first and wait for my OK.
- Keep changes scoped to what I asked for. Note other ideas at the end instead of doing them.

## Conventions

- TypeScript is pinned to ~6.0 because typescript-eslint does not support 7 yet.
- Server runtime dependencies go in `dependencies` (tsup bundles devDependencies).
- Shared code must run in the browser too: no `process.env` or Node APIs in `packages/shared`. Pass config (e.g. the affiliate tag) in as arguments.
