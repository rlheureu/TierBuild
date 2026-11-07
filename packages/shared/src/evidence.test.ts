import { describe, expect, it } from 'vitest';
import { CPUS, GPUS, TARGETS, byId } from './data.js';
import { evaluate } from './engine.js';
import { cpuEvidence, findPart, gpuEvidence, isPartCategory } from './evidence.js';

describe('cpuEvidence', () => {
  it('explains a Rare CPU against the framerate anchors and targets', () => {
    const e = cpuEvidence(byId(CPUS, 'i5-13400f')!);
    expect(e.tier).toBe(2);
    expect(e.sustainedFps).toBe(108);
    expect(e.anchors.map((a) => a.sustained)).toEqual([true, true, true, false, false, false]);

    const at = (id: string) => e.targets.find((t) => t.target.id === id)!;
    expect(at('1440p60')).toMatchObject({ requiredTier: 1, met: true, margin: 1 });
    expect(at('1440p144')).toMatchObject({ requiredTier: 3, met: false, margin: -1 });
  });
});

describe('gpuEvidence', () => {
  it('flags VRAM below the workload floor', () => {
    const e = gpuEvidence(byId(GPUS, 'rtx4060ti')!);
    expect(e.tier).toBe(2);
    const at1440p60 = e.targets.find((t) => t.target.id === '1440p60')!;
    expect(at1440p60).toMatchObject({ met: true, vramFloor: 10, vramOk: false });
  });

  it('notes one tier higher with an upscaler, except at the top tier or without one', () => {
    expect(gpuEvidence(byId(GPUS, 'rtx4090')!).upscaledTier).toBe(5);
    expect(gpuEvidence(byId(GPUS, 'rtx5090')!).upscaledTier).toBeNull();
    expect(gpuEvidence(byId(GPUS, 'gtx1650')!).upscaledTier).toBeNull();
  });
});

// The part page must explain the same math the result page uses.
describe('agreement with the engine', () => {
  const partnerGpu = GPUS[0]!;
  const partnerCpu = CPUS[0]!;

  it('matches evaluate() for every CPU on every target', () => {
    for (const cpu of CPUS) {
      const e = cpuEvidence(cpu);
      for (const check of e.targets) {
        const row = evaluate({
          cpuId: cpu.id,
          gpuId: partnerGpu.id,
          targetId: check.target.id,
        })!.rows.find((r) => r.category === 'cpu')!;
        expect(row.tier, `${cpu.id} tier`).toBe(e.tier);
        expect(check.margin, `${cpu.id} @ ${check.target.id}`).toBe(row.delta);
      }
    }
  });

  it('matches evaluate() for every GPU on every target, including the VRAM note', () => {
    for (const gpu of GPUS) {
      const e = gpuEvidence(gpu);
      for (const check of e.targets) {
        const row = evaluate({
          cpuId: partnerCpu.id,
          gpuId: gpu.id,
          targetId: check.target.id,
        })!.rows.find((r) => r.category === 'gpu')!;
        expect(check.margin, `${gpu.id} @ ${check.target.id}`).toBe(row.delta);
        const vramNote = row.notes.some((n) => n.startsWith('VRAM-limited'));
        expect(!check.vramOk, `${gpu.id} VRAM @ ${check.target.id}`).toBe(vramNote);
      }
    }
  });

  it('covers all eight monitor targets', () => {
    expect(cpuEvidence(CPUS[0]!).targets).toHaveLength(TARGETS.length);
    expect(gpuEvidence(GPUS[0]!).targets).toHaveLength(TARGETS.length);
  });
});

describe('findPart', () => {
  it('finds CPUs and GPUs by category and id', () => {
    expect(findPart('cpu', 'r7-9800x3d')?.name).toBe('AMD Ryzen 7 9800X3D');
    expect(findPart('gpu', 'rtx4090')?.name).toBe('NVIDIA RTX 4090');
    expect(findPart('cpu', 'rtx4090')).toBeUndefined();
  });

  it('only accepts cpu and gpu as categories', () => {
    expect(isPartCategory('cpu')).toBe(true);
    expect(isPartCategory('gpu')).toBe(true);
    expect(isPartCategory('ram')).toBe(false);
  });
});
