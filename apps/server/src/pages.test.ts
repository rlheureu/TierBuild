import { describe, expect, it } from 'vitest';
import { escapeHtml, renderPage } from './pages.js';

const template = `<html><head>
<title>TierBuild</title>
<meta
  name="description"
  content="Default description"
/>
</head><body></body></html>`;

describe('renderPage', () => {
  it('replaces the title and description', () => {
    const html = renderPage(template, { title: 'New title', description: 'New description' });
    expect(html).toContain('<title>New title</title>');
    expect(html).toContain('<meta name="description" content="New description" />');
    expect(html).not.toContain('Default description');
  });

  it('keeps the default description when none is given', () => {
    expect(renderPage(template, { title: 'X' })).toContain('Default description');
  });

  it('adds Open Graph tags inside <head>', () => {
    const html = renderPage(template, { title: 'T', ogTitle: 'OG title', ogDescription: 'OG d' });
    expect(html).toMatch(/<meta property="og:title" content="OG title" \/>[\s\S]*<\/head>/);
    expect(html).toContain('<meta property="og:description" content="OG d" />');
    expect(html).toContain('<meta property="og:type" content="website" />');
  });

  it('escapes text so it cannot break out of the tags', () => {
    const html = renderPage(template, {
      title: '</title><script>alert(1)</script>',
      description: '"><script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;');
  });
});

describe('escapeHtml', () => {
  it('escapes the five HTML-special characters', () => {
    expect(escapeHtml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&#39;f');
  });
});
