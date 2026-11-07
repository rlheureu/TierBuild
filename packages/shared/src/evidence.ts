// "Why this tier": the engine's own reasoning for one CPU or GPU, laid out for a part page.
// Everything here is derived from the catalog and engine — no extra data.

import { CPUS, GPUS, TARGETS, byId, type Cpu, type Gpu, type Target } from './data.js';
import { CPU_FPS_ANCHORS, NUM_SLOTS, VRAM_FLOOR, cpuTier, cpuTierRequired } from './engine.js';

export type PartCategory = 'cpu' | 'gpu';

export interface TargetCheck {
  target: Target;
  requiredTier: number;
  met: boolean;
  // Tiers above (positive) or below (negative) what the target needs.
  margin: number;
}

export interface GpuTargetCheck extends TargetCheck {
  vramFloor: number;
  vramOk: boolean;
}

export interface CpuEvidence {
  category: 'cpu';
  tier: number;
  sustainedFps: number;
  anchors: { tier: number; fps: number; sustained: boolean }[];
  targets: TargetCheck[];
}

export interface GpuEvidence {
  category: 'gpu';
  tier: number;
  vram: number;
  tdp: number;
  upscaler: Gpu['upscaler'];
  // One tier higher with the upscaler's Quality mode, as the result page notes; null if none.
  upscaledTier: number | null;
  targets: GpuTargetCheck[];
}

export function isPartCategory(value: string): value is PartCategory {
  return value === 'cpu' || value === 'gpu';
}

export function findPart(category: PartCategory, id: string): Cpu | Gpu | undefined {
  return category === 'cpu' ? byId(CPUS, id) : byId(GPUS, id);
}

export function cpuEvidence(cpu: Cpu): CpuEvidence {
  const tier = cpuTier(cpu);
  return {
    category: 'cpu',
    tier,
    sustainedFps: cpu.sustainedFps,
    anchors: CPU_FPS_ANCHORS.map((fps, i) => ({
      tier: i,
      fps,
      sustained: cpu.sustainedFps >= fps,
    })),
    targets: TARGETS.map((target) => {
      const requiredTier = cpuTierRequired(target.fps);
      return { target, requiredTier, met: tier >= requiredTier, margin: tier - requiredTier };
    }),
  };
}

export function gpuEvidence(gpu: Gpu): GpuEvidence {
  return {
    category: 'gpu',
    tier: gpu.tier,
    vram: gpu.vram,
    tdp: gpu.tdp,
    upscaler: gpu.upscaler,
    upscaledTier: gpu.upscaler && gpu.tier < NUM_SLOTS - 1 ? gpu.tier + 1 : null,
    targets: TARGETS.map((target) => {
      const vramFloor = VRAM_FLOOR[target.gpuTier]!;
      return {
        target,
        requiredTier: target.gpuTier,
        met: gpu.tier >= target.gpuTier,
        margin: gpu.tier - target.gpuTier,
        vramFloor,
        vramOk: gpu.vram >= vramFloor,
      };
    }),
  };
}
