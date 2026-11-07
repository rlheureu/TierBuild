import type { Cpu, Gpu, Psu, Resolution, Target, TieredPart, TierInfo } from './data.js';
import type { CpuEvidence, GpuEvidence } from './evidence.js';
import type { PartContent } from './partContent.js';

export * from './data.js';
export * from './engine.js';
export * from './evidence.js';
export type * from './partContent.js';

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

// GET /api/parts/:category/:id: everything a part page needs.
export type PartPageResponse =
  | {
      category: 'cpu';
      part: Cpu;
      tierInfo: TierInfo;
      evidence: CpuEvidence;
      content: PartContent | null;
    }
  | {
      category: 'gpu';
      part: Gpu;
      tierInfo: TierInfo;
      evidence: GpuEvidence;
      content: PartContent | null;
    };
