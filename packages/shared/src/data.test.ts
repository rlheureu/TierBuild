import { describe, expect, it } from 'vitest';
import { FPS_BY_RESOLUTION, resolveTarget } from './data.js';

describe('resolveTarget', () => {
  it('matches the legacy id for the same res + fps', () => {
    const byPair = resolveTarget({ resolution: '1440p', fps: 144 });
    const byId = resolveTarget({ targetId: '1440p144' });
    expect(byPair).toBeDefined();
    expect(byPair!.id).toBe(byId!.id);
    expect(byPair!.shortLabel).toBe('1440p @ 144');
  });

  it('accepts 4K aliases', () => {
    expect(resolveTarget({ resolution: 'uhd', fps: 60 })?.id).toBe('4k60');
    expect(resolveTarget({ resolution: '2160p', fps: '60' })?.id).toBe('4k60');
  });

  it('accepts fps as a query-string value', () => {
    expect(resolveTarget({ resolution: '1440p', fps: '144' })?.id).toBe('1440p144');
  });

  it('returns undefined for uncalibrated or invalid pairs', () => {
    expect(resolveTarget({ resolution: '1440p', fps: 30 })).toBeUndefined();
    expect(resolveTarget({ resolution: '1080p', fps: 999 })).toBeUndefined();
    expect(resolveTarget({ resolution: '1440p', fps: 'abc' })).toBeUndefined();
    expect(resolveTarget({ resolution: '1440p' })).toBeUndefined();
  });
});

describe('FPS_BY_RESOLUTION', () => {
  it('covers every calibrated target', () => {
    expect(FPS_BY_RESOLUTION['1080p']).toEqual([30, 60, 144]);
    expect(FPS_BY_RESOLUTION['1440p']).toEqual([60, 144]);
    expect(FPS_BY_RESOLUTION['4k']).toEqual([60, 120, 144]);
  });
});
