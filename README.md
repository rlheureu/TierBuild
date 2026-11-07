# TierBuild

**Performance-first gaming PC build checker.** Every part gets a colored loot-rarity tier, and your monitor's **resolution + framerate** set the target. The site answers: _what's holding this PC back for the panel you actually use?_

See the in-app Methodology page for the scoring model and tier ladder. Catalog prices and tiers are illustrative sample data.

## Layout

```
apps/
  web/        React + Vite frontend: form, result, and methodology pages
  server/     Express: /api routes, plus the built web app in production
packages/
  shared/     Catalog data (data.ts) and the bottleneck engine (engine.ts)
```

## Develop

Requires Node 22+.

```bash
npm ci
npm run dev
```

Open http://localhost:5173. The frontend reloads as you edit, and `/api` requests go to the server on port 3001.

Use `npm ci` to install exactly what `package-lock.json` lists. Use `npm install <package>` only when deliberately adding or upgrading a dependency.

## Run in production

```bash
npm ci
npm run build
npm start
```

Open http://localhost:3001. A single server handles the API and the web app, and fills in each `/build` page's title and description, so shared links get a meaningful preview.

| Environment variable | Default        | Purpose                                                        |
| -------------------- | -------------- | -------------------------------------------------------------- |
| `PORT`               | `3001`         | Port to listen on                                              |
| `AFFILIATE_TAG`      | `tierbuild-20` | Tag on upgrade links (never affects which part is recommended) |

## Permalinks

```
/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144
```

Optional: `ram`, `storage`, `psu`. Legacy `target=` ids (e.g. `target=1440p144`) still work.

## Scripts

| Script              | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Run the web and server dev servers        |
| `npm run build`     | Build all workspaces                      |
| `npm start`         | Run the production server (after `build`) |
| `npm test`          | Run tests (Vitest) in all workspaces      |
| `npm run typecheck` | Type-check all workspaces                 |
| `npm run lint`      | Lint with ESLint                          |
| `npm run format`    | Format with Prettier                      |

See CONTRIBUTING.md for the branch and pull request workflow.
