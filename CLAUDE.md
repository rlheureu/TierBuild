# TierBuild

## What this is
TierBuild is a performance-first gaming PC build checker. Every part gets a loot-rarity tier (Common → Mythic), and the user's monitor resolution + framerate set the target. It answers: what's holding this PC back for the panel you actually use? See README.md for the scoring model and tier ladder.

This is a personal, non-commercial hobby project. Favor simple, readable code over clever or "enterprise" patterns.

## About me
I'm a product manager, not a professional developer, and I'm learning git and GitHub as I go.
- Explain each git command you run in one short line.
- When you make a design choice, tell me briefly why.
- If I ask for something that's a bad idea technically, say so before doing it.

## Tech stack
- Python + Flask 3 (see requirements.txt), server-rendered Jinja templates, plain CSS
- Layout: app/data.py (tiers, res×fps matrix, catalog), app/engine.py (bottleneck math, recommendations), app/routes.py, app/templates/, app/static/
- Set up: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Run locally: `python tierbuild.py` → http://127.0.0.1:5050
- Run tests: `python -m unittest tests -v` — run these before every commit, and add tests for new engine logic

## Product rules (don't break these)
- CPU is tiered on framerate only; GPU on resolution + framerate.
- RAM can cap a build but never boost it. PSU is a safety flag, not a bottleneck bar.
- Recommendation order is never driven by affiliate rate.
- Frame generation is excluded from tier math in v1.
- Out of scope for v1: budget builder, live pricing, accounts, full compatibility checks.

## Git workflow
- Never commit directly to `main`. Start every piece of work on a new branch named for the work (e.g. `add-gpu-badge`).
- Make small commits after each working step, with a clear message saying what changed and why.
- Before committing, run the tests and show me a short summary of the diff.
- Never commit secrets or `.env`. Never force-push, rewrite history, or delete branches without asking me first.
- At the end of a session, remind me to push to GitHub.

## How to work with me
- For anything bigger than a small fix, show me a plan first and wait for my OK.
- Keep changes scoped to what I asked for. Note other ideas at the end instead of doing them.

## Project notes
<!-- Add conventions, decisions, and gotchas here as they come up -->
