import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CPUS,
  FPS_BY_RESOLUTION,
  GPUS,
  PSUS,
  RAM,
  RESOLUTIONS,
  STORAGE,
  TARGETS,
  TIERS,
  cpuEvidence,
  cpuTier,
  findPart,
  gpuEvidence,
  type CatalogResponse,
  type Cpu,
  type Gpu,
  type PartContent,
  type PartPageResponse,
} from '@tierbuild/shared';
import { App } from '../App';

const catalog: CatalogResponse = {
  tiers: TIERS,
  targets: TARGETS,
  resolutions: RESOLUTIONS,
  fpsByResolution: FPS_BY_RESOLUTION,
  cpus: CPUS.map((c) => ({ ...c, tier: cpuTier(c) })),
  gpus: GPUS,
  ram: RAM,
  storage: STORAGE,
  psus: PSUS,
};

const sampleContent: PartContent = {
  history: [{ text: 'It launched in October 2022.', sourceIds: ['launch'] }],
  oems: {
    boardPartners: [{ name: 'Example Graphics', sku: 'EX-4090 OC', sourceId: 'partner' }],
    prebuilts: [],
    laptops: [{ name: 'Example Laptop 16', sourceId: 'laptop', mobileVariant: true }],
  },
  sources: [
    {
      id: 'launch',
      title: 'Launch post',
      publisher: 'Example',
      url: 'https://example.com/a',
      accessed: '2026-11-07',
    },
    {
      id: 'partner',
      title: 'Card page',
      publisher: 'Example',
      url: 'https://example.com/b',
      accessed: '2026-11-07',
    },
    {
      id: 'laptop',
      title: 'Laptop page',
      publisher: 'Example',
      url: 'https://example.com/c',
      accessed: '2026-11-07',
    },
  ],
  reviewedOn: '2026-11-07',
};

// Builds API answers from the real catalog and evidence, the same way the server does.
function pageFor(
  category: string,
  id: string,
  content: PartContent | null,
): PartPageResponse | null {
  if (category === 'cpu') {
    const part = findPart('cpu', id) as Cpu | undefined;
    if (!part) return null;
    const evidence = cpuEvidence(part);
    return { category, part, tierInfo: TIERS[evidence.tier]!, evidence, content };
  }
  if (category === 'gpu') {
    const part = findPart('gpu', id) as Gpu | undefined;
    if (!part) return null;
    const evidence = gpuEvidence(part);
    return { category, part, tierInfo: TIERS[evidence.tier]!, evidence, content };
  }
  return null;
}

function mockApi(content: PartContent | null = null) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url === '/api/catalog') {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(catalog) });
      }
      const [, , , category = '', id = ''] = url.split('/');
      const page = pageFor(category, decodeURIComponent(id), content);
      return Promise.resolve({
        ok: page !== null,
        status: page ? 200 : 404,
        json: () => Promise.resolve(page ?? { error: 'not found' }),
      });
    }),
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('part page', () => {
  it('explains a CPU tier against the framerate ladder and every monitor target', async () => {
    mockApi();
    renderAt('/parts/cpu/i5-13400f');

    expect(await screen.findByRole('heading', { name: "Why it's Rare" })).toBeInTheDocument();
    expect(
      screen.getByText(/clears the 100 fps line for Rare, but not the 144 fps/),
    ).toBeInTheDocument();

    const targets = screen.getByRole('heading', {
      name: 'Against each monitor target',
    }).parentElement!;
    const rows = within(targets).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(8);
    expect(within(rows[2]!).getByText('✔ Meets, 1 tier spare')).toBeInTheDocument();
    expect(within(rows[4]!).getByText('✗ Short by 1 tier')).toBeInTheDocument();

    expect(screen.getByText(/Details coming soon/)).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Intel Core i5-13400F — Rare CPU — TierBuild'));
  });

  it('flags VRAM and notes upscaling on a GPU page', async () => {
    mockApi();
    renderAt('/parts/gpu/rtx4060ti');

    expect(await screen.findByRole('heading', { name: "Why it's Rare" })).toBeInTheDocument();
    expect(screen.getByText(/flagged below/)).toBeInTheDocument();
    expect(screen.getAllByText('⚠ Wants 10GB+').length).toBeGreaterThan(0);
    expect(screen.getByText(/With DLSS Quality upscaling/)).toHaveTextContent(
      'With DLSS Quality upscaling it plays like an Epic card.',
    );
  });

  it('renders history, OEMs and numbered sources when content exists', async () => {
    mockApi(sampleContent);
    renderAt('/parts/gpu/rtx4090');

    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText(/It launched in October 2022/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '#source-launch');
    expect(screen.getByText(/Example Graphics/)).toBeInTheDocument();
    expect(screen.getByText(/Example Laptop 16/).querySelector('.tag')).toHaveTextContent(
      'mobile version',
    );
    expect(screen.getByText(/performs differently from the desktop part/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Laptop page' })).toHaveAttribute(
      'href',
      'https://example.com/c',
    );
    expect(screen.queryByText(/Details coming soon/)).not.toBeInTheDocument();
  });

  it('shows the not-found page for unknown parts', async () => {
    mockApi();
    renderAt('/parts/gpu/nope');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('parts index', () => {
  it('groups GPUs and CPUs by tier, best first, linking to each part', async () => {
    mockApi();
    renderAt('/parts');

    const gpuSection = (await screen.findByRole('heading', { name: 'GPUs' })).parentElement!;
    const gpuTiers = within(gpuSection)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(gpuTiers).toEqual(['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']);
    expect(within(gpuSection).getByRole('link', { name: /NVIDIA RTX 4090/ })).toHaveAttribute(
      'href',
      '/parts/gpu/rtx4090',
    );

    const cpuSection = screen.getByRole('heading', { name: 'CPUs' }).parentElement!;
    expect(within(cpuSection).getByRole('link', { name: /Intel Core i5-13400F/ })).toHaveAttribute(
      'href',
      '/parts/cpu/i5-13400f',
    );
  });

  it('is linked from the nav', async () => {
    mockApi();
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Parts' })).toHaveAttribute('href', '/parts');
  });
});
