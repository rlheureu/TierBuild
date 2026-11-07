# Contributing workflow

TierBuild uses [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow): `main` always works, every change happens on a short-lived branch, and changes reach `main` only through a pull request (PR) that passes CI.

## 1. Start a branch

Branch from an up-to-date `main` for every change:

```bash
git switch main
git pull
git switch -c feat/drag-and-drop
```

Name branches `<type>/<short-description>`:

| Prefix      | Use for                               |
| ----------- | ------------------------------------- |
| `feat/`     | New user-facing behavior              |
| `fix/`      | Bug fixes                             |
| `refactor/` | Restructuring with no behavior change |
| `chore/`    | Tooling, dependencies, config, docs   |

Branches made by Claude Code sessions may be named `claude/...`; they follow the same rules.

## 2. How much belongs in one branch

**One branch = one purpose.** If you need "and" to describe it ("add tier editing _and_ upgrade Vite"), it is two branches.

Rough guides:

- A reviewer can read the whole diff in under ~20 minutes, about **400 lines or fewer** of hand-written changes (lockfiles and generated files don't count).
- The branch lives **a day or two**, not weeks. Long-lived branches drift from `main` and become painful to merge.
- Every merge leaves `main` working. If a feature is too big, ship it in slices that each work on their own (e.g. data model → API endpoint → UI).

When unrelated cleanup tempts you mid-branch, note it and do it in its own branch afterwards.

## 3. Commit as you go

Commit small, logical steps with messages that say what and why:

```
Add PUT /api/tier-lists/:id endpoint

Lets the web app save tier order after a drag.
```

Push regularly (`git push -u origin <branch>` the first time) so work is backed up.

## 4. Open a pull request

Open a PR into `main` once the change works, or earlier as a **draft** if you want feedback. Fill in the template. CI runs automatically.

## 5. Review: is it ready to merge?

A PR is ready when all of these hold:

1. **CI is green.** Formatting, lint, typecheck, tests, and build all pass. Never merge red.
2. **It does what it says.** You (or a reviewer) followed "How to test" and saw it work.
3. **It's tested.** New behavior has a test; a bug fix has a test that failed before the fix.
4. **It's focused.** No unrelated changes, leftover `console.log`s, commented-out code, or secrets.
5. **You understand every line.** Including code an AI wrote. If you can't explain a change, ask or remove it.

Working solo, you are the reviewer: read the diff on GitHub's "Files changed" tab as if someone else wrote it. Reading it in a different view than your editor catches surprisingly much. You can also ask Claude to review a PR before merging.

## 6. Merge and clean up

- Use **Squash and merge**, so each PR becomes one tidy commit on `main`.
- Delete the branch after merging (GitHub offers a button).
- Locally: `git switch main && git pull`, then start the next branch from there.
- Don't add new commits to a branch whose PR is already merged. Start a fresh branch.

## Recommended GitHub settings

In **Settings → Branches → Add branch ruleset** (or classic branch protection) for `main`:

- Require a pull request before merging
- Require status checks to pass: **CI / check**
- Block force pushes

In **Settings → General → Pull Requests**: allow only squash merging, and enable "Automatically delete head branches".
