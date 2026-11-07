import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluate } from '@tierbuild/shared';
import { App } from '../App';

// Answers /api/build with the real engine so the page renders genuine results.
function mockBuildApi() {
  const fetchMock = vi.fn((url: string) => {
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const result = evaluate({
      cpuId: query.get('cpu'),
      gpuId: query.get('gpu'),
      resolution: query.get('res'),
      fps: query.get('fps'),
      targetId: query.get('target'),
      ramId: query.get('ram'),
      storageId: query.get('storage'),
      psuId: query.get('psu'),
    });
    return Promise.resolve({
      ok: result !== null,
      status: result ? 200 : 400,
      json: () => Promise.resolve(result ?? { error: 'bad input' }),
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
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

describe('result page', () => {
  it('shows the bottleneck, bars, upgrade pick and loot cards', async () => {
    mockBuildApi();
    const { container } = renderAt(
      '/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144&ram=ddr5-32&psu=psu650',
    );

    expect(await screen.findByRole('heading', { name: '⚠ Bottleneck found' })).toBeInTheDocument();
    expect(screen.getByText(/Your CPU is your bottleneck for 1440p @ 144/)).toBeInTheDocument();
    expect(screen.getByText(/650W 80\+ Bronze is insufficient/)).toHaveClass('psu-danger');
    expect(screen.getByText('AMD Ryzen 5 9600X')).toHaveClass('reco-part', 'tier-text-3');
    expect(screen.getByRole('link', { name: 'See price — $279' })).toHaveAttribute(
      'href',
      expect.stringContaining('AMD+Ryzen+5+9600X'),
    );
    expect(screen.getByText('AMD Ryzen 7 7800X3D')).toBeInTheDocument();
    expect(container.querySelectorAll('.bar-row')).toHaveLength(3);
    expect(container.querySelectorAll('.bar-fill.bottleneck')).toHaveLength(1);
    expect(container.querySelector('.loot-card.is-bottleneck')).toHaveTextContent('CPU');
    expect(screen.getByText('Display demand')).toBeInTheDocument();
    // The title is set in an effect that can run just after the heading appears.
    await waitFor(() => expect(document.title).toBe('CPU bottleneck at 1440p @ 144 — TierBuild'));
  });

  it('shows a balanced build without an upgrade pick', async () => {
    mockBuildApi();
    renderAt('/build?cpu=i5-13400f&gpu=rtx4090&res=4k&fps=60');

    expect(await screen.findByRole('heading', { name: '✔ Nicely balanced' })).toBeInTheDocument();
    expect(screen.getByText(/your monitor is now the bottleneck/)).toBeInTheDocument();
    expect(screen.queryByText('Highest-impact upgrade')).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Balanced at 4K @ 60 — TierBuild'));
  });

  it('starts the target caption at the line when the line is left of the middle', async () => {
    mockBuildApi();
    const { container } = renderAt('/build?cpu=i5-13400f&gpu=rtx4090&res=1080p&fps=60');
    await screen.findByText('Display demand');
    const flag = container.querySelector('.target-flag')!;
    expect(flag).toHaveTextContent('▲ target: 1080p @ 60');
    expect(flag).not.toHaveClass('flag-end');
    expect(flag).toHaveStyle({ left: '33.3%' });
  });

  it('ends the target caption at the line when the line is right of the middle', async () => {
    mockBuildApi();
    const { container } = renderAt('/build?cpu=i5-13400f&gpu=rtx4090&res=4k&fps=60');
    await screen.findByText('Display demand');
    const flag = container.querySelector('.target-flag')!;
    expect(flag).toHaveTextContent('target: 4K @ 60 ▲');
    expect(flag).toHaveClass('flag-end');
    expect(flag).toHaveStyle({ left: '66.7%' });
  });

  it('passes legacy target links through to the API', async () => {
    const fetchMock = mockBuildApi();
    renderAt('/build?cpu=i5-13400f&gpu=rtx4090&target=1440p144');

    expect(await screen.findByRole('heading', { name: '⚠ Bottleneck found' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/build?cpu=i5-13400f&gpu=rtx4090&target=1440p144');
  });

  it('sends bad links back to the form', async () => {
    mockBuildApi();
    renderAt('/build?cpu=bogus&gpu=rtx4090&res=1440p&fps=144');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
  });

  it('explains when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    renderAt('/build?cpu=i5-13400f&gpu=rtx4090&res=1440p&fps=144');

    expect(await screen.findByText(/Couldn't check this build/)).toBeInTheDocument();
  });

  it('copies the share link', async () => {
    mockBuildApi();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    renderAt('/build?cpu=i5-13400f&gpu=rtx4090&res=4k&fps=60');

    fireEvent.click(await screen.findByRole('button', { name: 'Copy link' }));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
});
