import { Link } from 'react-router';
import { usePageTitle } from '../api';

export function NotFound() {
  usePageTitle('Page not found — TierBuild');
  return (
    <>
      <section className="hero small">
        <h1>Page not found</h1>
      </section>
      <p className="back">
        <Link to="/">← Back to the build checker</Link>
      </p>
    </>
  );
}
