import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('shows API status from the health endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve({ status: 'ok' }) }),
    );
    render(<App />);
    expect(screen.getByRole('heading', { name: 'TierBuild' })).toBeInTheDocument();
    expect(await screen.findByText('API status: ok')).toBeInTheDocument();
  });
});
