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

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

// Each answer remembers which URL it was for, so a new URL reads as loading.
export function useApiData<T>(url: string): ApiState<T> {
  const [answer, setAnswer] = useState<{ url: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (state: ApiState<T>) => {
      if (!cancelled) setAnswer({ url, state });
    };
    fetch(url)
      .then(async (res) => {
        if (res.status === 404) {
          settle({ status: 'notFound' });
        } else if (!res.ok) {
          settle({ status: 'error' });
        } else {
          settle({ status: 'ready', data: (await res.json()) as T });
        }
      })
      .catch(() => settle({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return answer?.url === url ? answer.state : { status: 'loading' };
}

export function partPath(category: 'cpu' | 'gpu', id: string): string {
  return `/parts/${category}/${encodeURIComponent(id)}`;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
