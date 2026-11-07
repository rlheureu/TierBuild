import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
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
  cpuTier,
  type CatalogResponse,
} from '@tierbuild/shared';
import { App } from './App';

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

function mockCatalog(ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(catalog) }),
  );
}

function ShowLocation() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Routes>
        <Route path="*" element={<ShowLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('home page', () => {
  it('renders the form once the catalog loads', async () => {
    mockCatalog();
    const { container } = renderAt('/');
    expect(
      screen.getByRole('heading', { name: "What's holding your PC back?" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Check my build' })).toBeInTheDocument();
    expect(container.querySelector('select[name="res"]')).not.toBeNull();
    expect(container.querySelector('select[name="fps"]')).not.toBeNull();
    expect(screen.getByText('Mythic')).toBeInTheDocument();
  });

  it('links each tier on the ladder to that tier of the parts list', async () => {
    mockCatalog();
    renderAt('/');
    expect(await screen.findByRole('link', { name: /Rare/ })).toHaveAttribute(
      'href',
      '/parts?tier=rare',
    );
    expect(screen.getByRole('link', { name: 'Browse all parts →' })).toHaveAttribute(
      'href',
      '/parts',
    );
  });

  it('offers an about-this-part link once a CPU or GPU is picked', async () => {
    mockCatalog();
    const { container } = renderAt('/');
    await screen.findByRole('button', { name: 'Check my build' });
    expect(screen.queryByRole('link', { name: /About this CPU/ })).not.toBeInTheDocument();

    fireEvent.change(container.querySelector('select[name="cpu"]')!, {
      target: { value: 'i5-13400f' },
    });
    const cpuLink = screen.getByRole('link', { name: /About this CPU/ });
    expect(cpuLink).toHaveAttribute('href', '/parts/cpu/i5-13400f');
    expect(cpuLink).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('link', { name: /About this GPU/ })).not.toBeInTheDocument();

    fireEvent.change(container.querySelector('select[name="gpu"]')!, {
      target: { value: 'rtx4090' },
    });
    expect(screen.getByRole('link', { name: /About this GPU/ })).toHaveAttribute(
      'href',
      '/parts/gpu/rtx4090',
    );
  });

  it('only offers calibrated framerates for the chosen resolution', async () => {
    mockCatalog();
    const { container } = renderAt('/');
    await screen.findByRole('button', { name: 'Check my build' });
    const fps = container.querySelector<HTMLSelectElement>('select[name="fps"]')!;
    expect(fps).toBeDisabled();

    fireEvent.change(container.querySelector('select[name="res"]')!, {
      target: { value: '1440p' },
    });
    expect(fps).toBeEnabled();
    const values = [...fps.options].map((o) => o.value).filter(Boolean);
    expect(values).toEqual(['60', '144']);
  });

  it('submits to a /build permalink, leaving out skipped optional parts', async () => {
    mockCatalog();
    const { container } = renderAt('/');
    await screen.findByRole('button', { name: 'Check my build' });
    const set = (name: string, value: string) =>
      fireEvent.change(container.querySelector(`select[name="${name}"]`)!, { target: { value } });
    set('cpu', 'i5-13400f');
    set('gpu', 'rtx4090');
    set('res', '1440p');
    set('fps', '144');
    set('psu', 'psu650');
    fireEvent.click(screen.getByRole('button', { name: 'Check my build' }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144&psu=psu650',
    );
  });

  it('explains when the catalog cannot load', async () => {
    mockCatalog(false);
    renderAt('/');
    expect(await screen.findByText(/Couldn't load the parts list/)).toBeInTheDocument();
  });
});

describe('methodology page', () => {
  it('renders the methodology and supported workloads', async () => {
    mockCatalog();
    renderAt('/methodology');
    expect(
      screen.getByText('Resolution loads the GPU; framerate loads the CPU'),
    ).toBeInTheDocument();
    expect(await screen.findByText('1440p @ 144')).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('links to the methodology page from the nav', async () => {
    mockCatalog();
    renderAt('/');
    fireEvent.click(screen.getByRole('link', { name: 'Methodology' }));
    expect(screen.getByRole('heading', { name: 'Methodology' })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown paths', () => {
    mockCatalog();
    renderAt('/nope');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
