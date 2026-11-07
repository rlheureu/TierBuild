import type { Cpu, Gpu, Psu, Resolution, Target, TieredPart, TierInfo } from './data.js';

export * from './data.js';
export * from './engine.js';

export interface HealthResponse {
  status: 'ok';
}

// GET /api/catalog: everything the build form needs.
export interface CatalogResponse {
  tiers: TierInfo[];
  targets: Target[];
  resolutions: { id: Resolution; label: string }[];
  fpsByResolution: Record<Resolution, number[]>;
  cpus: (Cpu & { tier: number })[];
  gpus: Gpu[];
  ram: TieredPart[];
  storage: TieredPart[];
  psus: Psu[];
}
