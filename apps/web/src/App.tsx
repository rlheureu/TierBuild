import { useEffect, useState } from 'react';
import type { HealthResponse } from '@tierbuild/shared';

export function App() {
  const [status, setStatus] = useState<string>('checking…');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json() as Promise<HealthResponse>)
      .then((body) => setStatus(body.status))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <main>
      <h1>TierBuild</h1>
      <p>API status: {status}</p>
    </main>
  );
}
