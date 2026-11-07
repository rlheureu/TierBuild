import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/catalog', () => {
  it('returns the form data, with CPUs sorted by fps and tiered', async () => {
    const res = await request(app).get('/api/catalog');
    expect(res.status).toBe(200);
    expect(res.body.tiers).toHaveLength(6);
    expect(res.body.fpsByResolution['1440p']).toEqual([60, 144]);
    expect(res.body.cpus[0]).toMatchObject({ id: 'r7-9800x3d', tier: 5 });
    expect(res.body.gpus[0].id).toBe('rtx5090');
    expect(res.body.psus.length).toBeGreaterThan(0);
  });
});

describe('GET /api/build', () => {
  it('evaluates a res + fps permalink', async () => {
    const res = await request(app).get('/api/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144');
    expect(res.status).toBe(200);
    expect(res.body.workload).toBe('1440p @ 144');
    expect(res.body.bottleneck.category).toBe('cpu');
  });

  it('still accepts the legacy target param', async () => {
    const res = await request(app).get('/api/build?cpu=i5-13400f&gpu=rtx4090&target=1440p144');
    expect(res.status).toBe(200);
    expect(res.body.workload).toBe('1440p @ 144');
  });

  it('passes optional parts through, ignoring empty values', async () => {
    const res = await request(app).get(
      '/api/build?cpu=r7-9800x3d&gpu=rtx5090&res=4k&fps=144&ram=ddr4-16&storage=&psu=psu450',
    );
    expect(res.status).toBe(200);
    expect(res.body.bottleneck.category).toBe('ram');
    expect(res.body.psuStatus.level).toBe('danger');
    expect(res.body.storageNote).toBeNull();
  });

  it('rejects an unknown part with 400', async () => {
    const res = await request(app).get('/api/build?cpu=bogus&gpu=rtx4090&res=1440p&fps=144');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects an uncalibrated res + fps pair with 400', async () => {
    const res = await request(app).get('/api/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=30');
    expect(res.status).toBe(400);
  });

  it('rejects repeated params instead of guessing', async () => {
    const res = await request(app).get(
      '/api/build?cpu=i5-13400f&cpu=r5-7600&gpu=rtx4090&res=1440p&fps=144',
    );
    expect(res.status).toBe(400);
  });

  it('uses the configured affiliate tag in recommendation links', async () => {
    const res = await request(createApp({ affiliateTag: 'mytag-20' })).get(
      '/api/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144',
    );
    expect(res.body.recommendation.url).toContain('&tag=mytag-20');
  });
});
