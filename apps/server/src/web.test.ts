import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

// A stand-in for apps/web/dist, shaped like Vite's output.
const webDist = mkdtempSync(path.join(tmpdir(), 'tierbuild-web-'));
writeFileSync(
  path.join(webDist, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <title>TierBuild</title>
    <meta
      name="description"
      content="Default description"
    />
    <script type="module" src="/assets/app.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>`,
);
mkdirSync(path.join(webDist, 'assets'));
writeFileSync(path.join(webDist, 'assets', 'app.js'), 'console.log("app")');

afterAll(() => rmSync(webDist, { recursive: true, force: true }));

const app = createApp({ webDist });

describe('serving the web app', () => {
  it('serves the home page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('<title>TierBuild</title>');
    expect(res.text).toContain('<div id="root">');
  });

  it('serves built assets', async () => {
    const res = await request(app).get('/assets/app.js');
    expect(res.status).toBe(200);
    expect(res.text).toContain('console.log');
  });

  it('titles the methodology page', async () => {
    const res = await request(app).get('/methodology');
    expect(res.text).toContain('<title>TierBuild — Methodology</title>');
  });

  it('gives /build links a share preview from the real verdict', async () => {
    const res = await request(app).get('/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>CPU bottleneck at 1440p @ 144 — TierBuild</title>');
    expect(res.text).toContain(
      '<meta property="og:title" content="CPU bottleneck at 1440p @ 144 — TierBuild" />',
    );
    // The verdict's apostrophe ("You're") is escaped.
    expect(res.text).toContain('You&#39;re leaving roughly 2 tiers of GPU performance');
    expect(res.text).toContain('content="Build check for 1440p @ 144: Your CPU is your bottleneck');
    expect(res.text).not.toContain('Default description');
  });

  it('previews balanced builds and legacy links', async () => {
    const balanced = await request(app).get('/build?cpu=i5-13400f&gpu=rtx4090&res=4k&fps=60');
    expect(balanced.text).toContain('<title>Balanced at 4K @ 60 — TierBuild</title>');
    const legacy = await request(app).get('/build?cpu=i5-13400f&gpu=rtx4090&target=1440p144');
    expect(legacy.text).toContain('<title>CPU bottleneck at 1440p @ 144 — TierBuild</title>');
  });

  it('redirects bad /build links to the form', async () => {
    const res = await request(app).get('/build?cpu=bogus&gpu=rtx4090&res=1440p&fps=144');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  it('returns 404 with the web app for unknown pages', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.text).toContain('<title>Page not found — TierBuild</title>');
  });

  it('keeps unknown API routes as plain 404s', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('<div id="root">');
  });
});

describe('without a built web app', () => {
  it('stays API-only', async () => {
    const apiOnly = createApp({ webDist: path.join(webDist, 'missing') });
    expect((await request(apiOnly).get('/')).status).toBe(404);
    expect((await request(apiOnly).get('/api/health')).status).toBe(200);
  });
});
