// Fills in the built web app's <title> and description per page, so shared links
// get a meaningful preview (Reddit, Discord, etc. don't run the page's JavaScript).

export interface PageMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderPage(template: string, meta: PageMeta): string {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  if (meta.description) {
    html = html.replace(
      /<meta\s+name="description"[^>]*>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    );
  }
  if (meta.ogTitle) {
    const og = [
      `<meta property="og:title" content="${escapeHtml(meta.ogTitle)}" />`,
      `<meta property="og:description" content="${escapeHtml(meta.ogDescription ?? '')}" />`,
      '<meta property="og:type" content="website" />',
    ].join('\n    ');
    html = html.replace('</head>', `  ${og}\n  </head>`);
  }
  return html;
}
