import { describe, expect, it } from 'vitest';
import { GPUS } from './data.js';
import { VRAM_FLOOR, affiliateUrl, evaluate } from './engine.js';

// The canonical example: a Rare CPU + Legendary GPU bottlenecks at 1440p @ 144
// but is balanced at 4K @ 60.
describe('evaluate', () => {
  it('finds a CPU bottleneck at 1440p @ 144', () => {
    const result = evaluate({
      cpuId: 'i5-13400f',
      gpuId: 'rtx4090',
      resolution: '1440p',
      fps: 144,
    })!;
    expect(result.bottleneck?.category).toBe('cpu');
    expect(result.workload).toBe('1440p @ 144');
    expect(result.recommendation?.category).toBe('cpu');
    expect(result.verdict).toContain('1440p @ 144');
  });

  it('calls the same build balanced at 4K @ 60', () => {
    const result = evaluate({ cpuId: 'i5-13400f', gpuId: 'rtx4090', resolution: '4k', fps: 60 })!;
    expect(result.bottleneck).toBeNull();
    expect(result.workload).toBe('4K @ 60');
    expect(result.verdict).toContain('monitor');
  });

  it('still accepts a legacy target id', () => {
    const result = evaluate({ cpuId: 'i5-13400f', gpuId: 'rtx4090', targetId: '1440p144' })!;
    expect(result.bottleneck?.category).toBe('cpu');
  });

  it('recommends the cheapest adequate GPU for a GPU bottleneck', () => {
    const result = evaluate({
      cpuId: 'r7-9800x3d',
      gpuId: 'rtx4060',
      resolution: '1440p',
      fps: 144,
    })!;
    expect(result.bottleneck?.category).toBe('gpu');
    const rec = result.recommendation!.part;
    expect(rec.tier).toBeGreaterThanOrEqual(3);
    const cheaper = GPUS.filter(
      (g) => g.tier >= 3 && g.vram >= VRAM_FLOOR[3]! && g.price < rec.price,
    );
    expect(cheaper).toEqual([]);
  });

  it('lets RAM cap the build', () => {
    const result = evaluate({
      cpuId: 'r7-9800x3d',
      gpuId: 'rtx5090',
      resolution: '4k',
      fps: 144,
      ramId: 'ddr4-16',
    })!;
    expect(result.bottleneck?.category).toBe('ram');
  });

  it('treats an insufficient PSU as a safety flag, not a bottleneck', () => {
    const result = evaluate({
      cpuId: 'r7-9800x3d',
      gpuId: 'rtx5090',
      resolution: '4k',
      fps: 144,
      psuId: 'psu450',
    })!;
    expect(result.psuStatus?.level).toBe('danger');
    expect(result.bottleneck).toBeNull();
  });

  it('warns about VRAM on an 8GB card at 1440p', () => {
    const result = evaluate({
      cpuId: 'r5-7600',
      gpuId: 'rtx4060ti',
      resolution: '1440p',
      fps: 60,
    })!;
    const gpuRow = result.rows.find((r) => r.category === 'gpu')!;
    expect(gpuRow.notes.some((n) => n.includes('VRAM-limited'))).toBe(true);
  });

  it('returns null for unknown parts or uncalibrated targets', () => {
    expect(evaluate({ cpuId: 'nope', gpuId: 'rtx4090', resolution: '4k', fps: 60 })).toBeNull();
    expect(
      evaluate({ cpuId: 'r5-7600', gpuId: 'rtx4090', resolution: '1440p', fps: 30 }),
    ).toBeNull();
  });

  it('mentions res @ fps, CPU and GPU in the capacity summary', () => {
    const result = evaluate({
      cpuId: 'i5-13400f',
      gpuId: 'rtx4090',
      resolution: '1440p',
      fps: 144,
    })!;
    expect(result.capacity).toContain('1440p @ 144');
    expect(result.capacity).toContain('CPU');
    expect(result.capacity).toContain('GPU');
  });

  it('adds a storage note when storage is under tier', () => {
    const result = evaluate({
      cpuId: 'r7-9800x3d',
      gpuId: 'rtx5090',
      resolution: '4k',
      fps: 144,
      storageId: 'sata-1tb',
    })!;
    expect(result.storageNote).toContain('SATA');
  });
});

describe('affiliateUrl', () => {
  it('uses the given tag, falling back to the default', () => {
    expect(affiliateUrl({ name: 'AMD RX 7600' }, 'mytag-20')).toBe(
      'https://www.amazon.com/s?k=AMD+RX+7600&tag=mytag-20',
    );
    expect(affiliateUrl({ name: 'AMD RX 7600' })).toContain('&tag=tierbuild-20');
  });

  it('encodes characters that would break the query string', () => {
    expect(affiliateUrl({ name: 'Ryzen 9 & Co #1 +plus 100%' }, 'mytag-20')).toBe(
      'https://www.amazon.com/s?k=Ryzen+9+%26+Co+%231+%2Bplus+100%25&tag=mytag-20',
    );
  });

  it('leaves characters that are valid in a URL alone', () => {
    expect(affiliateUrl({ name: 'AMD Radeon 780M (iGPU)' }, 'mytag-20')).toBe(
      'https://www.amazon.com/s?k=AMD+Radeon+780M+(iGPU)&tag=mytag-20',
    );
  });

  it('keeps a stray & in the tag from adding extra parameters', () => {
    expect(affiliateUrl({ name: 'AMD RX 7600' }, 'mytag-20&k=other')).toBe(
      'https://www.amazon.com/s?k=AMD+RX+7600&tag=mytag-20%26k%3Dother',
    );
  });
});
