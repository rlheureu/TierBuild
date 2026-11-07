import { useEffect, useState } from 'react';
import type { CatalogResponse } from '@tierbuild/shared';

export type CatalogState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; catalog: CatalogResponse };

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/catalog')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<CatalogResponse>;
      })
      .then((catalog) => {
        if (!cancelled) setState({ status: 'ready', catalog });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
