import type { PartContent } from '@tierbuild/shared';
import { describe, expect, it } from 'vitest';
import { partMeta, partPage } from './parts.js';

const sampleContent: PartContent = {
  history: [{ text: 'Launched in 2022.', sourceIds: ['launch'] }],
  oems: { boardPartners: [], prebuilts: [], laptops: [] },
  sources: [
    {
      id: 'launch',
      title: 'Launch announcement',
      publisher: 'Example',
      url: 'https://example.com',
      accessed: '2026-11-07',
    },
  ],
  reviewedOn: '2026-11-07',
};

describe('partPage', () => {
  it('builds a CPU page from the catalog and engine', () => {
    const page = partPage('cpu', 'i5-13400f')!;
    expect(page.category).toBe('cpu');
    expect(page.part.name).toBe('Intel Core i5-13400F');
    expect(page.tierInfo.name).toBe('Rare');
    expect(page.evidence.targets).toHaveLength(8);
    expect(page.content).toBeNull();
  });

  it('builds a GPU page', () => {
    const page = partPage('gpu', 'rtx4090')!;
    expect(page.tierInfo.name).toBe('Legendary');
    expect(page.evidence.category).toBe('gpu');
  });

  it('attaches content when there is some for the part', () => {
    const page = partPage('gpu', 'rtx4090', { cpu: {}, gpu: { rtx4090: sampleContent } })!;
    expect(page.content).toEqual(sampleContent);
  });

  it('returns null for unknown parts, wrong categories, and prototype names', () => {
    expect(partPage('cpu', 'nope')).toBeNull();
    expect(partPage('cpu', 'rtx4090')).toBeNull();
    expect(partPage('ram', 'ddr4-16')).toBeNull();
    expect(partPage('gpu', 'constructor')).toBeNull();
  });

  it('never treats prototype names as content', () => {
    const page = partPage('gpu', 'rtx4090', { cpu: {}, gpu: {} })!;
    expect(page.content).toBeNull();
  });
});

describe('partMeta', () => {
  it('titles a GPU page with its tier', () => {
    const meta = partMeta(partPage('gpu', 'rtx4090')!);
    expect(meta.title).toBe('NVIDIA RTX 4090 — Legendary GPU — TierBuild');
    expect(meta.description).toContain('24GB VRAM');
  });

  it('describes a CPU page with its sustained fps', () => {
    const meta = partMeta(partPage('cpu', 'i5-13400f')!);
    expect(meta.title).toBe('Intel Core i5-13400F — Rare CPU — TierBuild');
    expect(meta.description).toContain('about 108 fps sustained');
  });
});
