import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import express, { type Request } from 'express';
import {
  CPUS,
  FPS_BY_RESOLUTION,
  GPUS,
  PSUS,
  RAM,
  RESOLUTIONS,
  STORAGE,
  TARGETS,
  TIERS,
  cpuTier,
  evaluate,
  resolveTarget,
  type BuildResult,
  type CatalogResponse,
  type HealthResponse,
} from '@tierbuild/shared';
import { renderPage, type PageMeta } from './pages.js';

export interface AppOptions {
  affiliateTag?: string;
  // Folder with the built web app (apps/web/dist). Without it, the server is API-only.
  webDist?: string;
}

// The form's dropdown data. CPUs get their computed tier so the frontend doesn't need the engine.
const catalog: CatalogResponse = {
  tiers: TIERS,
  targets: TARGETS,
  resolutions: RESOLUTIONS,
  fpsByResolution: FPS_BY_RESOLUTION,
  cpus: [...CPUS]
    .sort((a, b) => b.sustainedFps - a.sustainedFps)
    .map((cpu) => ({ ...cpu, tier: cpuTier(cpu) })),
  gpus: [...GPUS].sort((a, b) => b.tier - a.tier || b.price - a.price),
  ram: RAM,
  storage: STORAGE,
  psus: PSUS,
};

// Query values can arrive as arrays (?cpu=a&cpu=b); only a single string counts.
function param(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

// Same query string as the Flask /build permalinks:
// ?cpu=&gpu=&res=&fps=[&ram=&storage=&psu=], or the legacy ?target=1440p144.
function buildFromQuery(query: Request['query'], affiliateTag?: string): BuildResult | null {
  let resolution = param(query.res);
  let fps = param(query.fps);
  const targetId = param(query.target);

  if (!resolution && !fps && targetId) {
    const legacy = resolveTarget({ targetId });
    if (legacy) {
      resolution = legacy.resolution;
      fps = String(legacy.fps);
    }
  }

  return evaluate({
    cpuId: param(query.cpu),
    gpuId: param(query.gpu),
    resolution,
    fps,
    targetId: resolution ? undefined : targetId,
    ramId: param(query.ram),
    storageId: param(query.storage),
    psuId: param(query.psu),
    affiliateTag,
  });
}

function resultMeta(result: BuildResult): PageMeta {
  const title = result.bottleneck
    ? `${result.bottleneck.label} bottleneck at ${result.workload} — TierBuild`
    : `Balanced at ${result.workload} — TierBuild`;
  return {
    title,
    description: `Build check for ${result.workload}: ${result.verdict}`,
    ogTitle: title,
    ogDescription: result.verdict,
  };
}

export function createApp(options: AppOptions = {}) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' };
    res.json(body);
  });

  app.get('/api/catalog', (_req, res) => {
    res.json(catalog);
  });

  app.get('/api/build', (req, res) => {
    const result = buildFromQuery(req.query, options.affiliateTag);
    if (!result) {
      res.status(400).json({
        error: 'Unknown CPU or GPU, or an unsupported resolution and framerate combination.',
      });
      return;
    }
    res.json(result);
  });

  const indexPath = options.webDist && path.join(options.webDist, 'index.html');
  if (indexPath && existsSync(indexPath)) {
    const template = readFileSync(indexPath, 'utf8');
    app.use(express.static(options.webDist!, { index: false }));

    app.get('/', (_req, res) => {
      res.type('html').send(renderPage(template, { title: 'TierBuild' }));
    });

    app.get('/methodology', (_req, res) => {
      res.type('html').send(renderPage(template, { title: 'TierBuild — Methodology' }));
    });

    app.get('/build', (req, res) => {
      const result = buildFromQuery(req.query, options.affiliateTag);
      if (!result) {
        res.redirect('/');
        return;
      }
      res.type('html').send(renderPage(template, resultMeta(result)));
    });

    // Any other page: let the web app show its "Page not found" screen, with a real 404 status.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res
        .status(404)
        .type('html')
        .send(renderPage(template, { title: 'Page not found — TierBuild' }));
    });
  }

  return app;
}
