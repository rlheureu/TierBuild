import express from 'express';
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
  type CatalogResponse,
  type HealthResponse,
} from '@tierbuild/shared';

export interface AppOptions {
  affiliateTag?: string;
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

  // Same query string as the Flask /build permalinks:
  // ?cpu=&gpu=&res=&fps=[&ram=&storage=&psu=], or the legacy ?target=1440p144.
  app.get('/api/build', (req, res) => {
    let resolution = param(req.query.res);
    let fps = param(req.query.fps);
    const targetId = param(req.query.target);

    if (!resolution && !fps && targetId) {
      const legacy = resolveTarget({ targetId });
      if (legacy) {
        resolution = legacy.resolution;
        fps = String(legacy.fps);
      }
    }

    const result = evaluate({
      cpuId: param(req.query.cpu),
      gpuId: param(req.query.gpu),
      resolution,
      fps,
      targetId: resolution ? undefined : targetId,
      ramId: param(req.query.ram),
      storageId: param(req.query.storage),
      psuId: param(req.query.psu),
      affiliateTag: options.affiliateTag,
    });

    if (!result) {
      res.status(400).json({
        error: 'Unknown CPU or GPU, or an unsupported resolution and framerate combination.',
      });
      return;
    }
    res.json(result);
  });

  return app;
}
